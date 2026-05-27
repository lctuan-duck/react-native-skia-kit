package com.margelo.nitro.skiakit

import android.content.Context
import android.graphics.SurfaceTexture
import android.view.TextureView
import android.view.ViewGroup
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.shopify.reactnative.skia.PlatformContext
import com.shopify.reactnative.skia.RNSkiaModule
import com.shopify.reactnative.skia.SkiaManager

/**
 * SkiaKitNativeView — Custom view host GPU surface cho C++ Skia renderer.
 *
 * Phase 3: Multi-instance support — mỗi view nhận `engineId` prop từ JS (CanvasRoot).
 * JNI lookup engine qua HybridUIEngine::findById(engineId) thay vì singleton.
 *
 * Flow:
 *   1. JS CanvasRoot set engineId prop → ViewManager gọi setEngineId()
 *   2. TextureView tạo SurfaceTexture (GPU-backed buffer)
 *   3. onSurfaceTextureAvailable → nativeOnSurfaceAvailable(engineId, ...) →
 *      C++ tạo RNSkOpenGLCanvasProvider → attach vào đúng HybridUIEngine._renderer
 *   4. Mỗi khi C++ scheduleRender() → renderToCanvas() → vẽ lên GPU surface
 */
class SkiaKitNativeView(context: Context) : ViewGroup(context),
    TextureView.SurfaceTextureListener {

    /** Engine ID được set từ JS qua engineId prop. -1 = chưa set. */
    private var _engineId: Long = -1L

    /**
     * Set engine ID — gọi từ SkiaKitNativeViewManager khi JS set engineId prop.
     * Nếu surface đã available trước khi engineId được set, trigger lại surface setup.
     */
    fun setEngineId(id: Long) {
        _engineId = id
        Log.i(TAG, "setEngineId: $_engineId")
        // Nếu surface đã available rồi mà engineId mới được set → inject context + attach now
        textureView.surfaceTexture?.let { st ->
            val w = textureView.width
            val h = textureView.height
            if (w > 0 && h > 0) {
                val manager = getSkiaManager()
                if (manager != null) {
                    nativeInitPlatformContext(_engineId, manager)
                    nativeOnSurfaceAvailable(_engineId, st, w, h)
                } else {
                    Log.e(TAG, "setEngineId: SkiaManager null, cannot attach surface")
                }
            }
        }
    }

    private val textureView = TextureView(context).apply {
        isOpaque = false
    }

    init {
        setWillNotDraw(false)
        addView(
            textureView,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        )
        textureView.surfaceTextureListener = this
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        textureView.layout(0, 0, r - l, b - t)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        if (_engineId < 0) {
            Log.w(TAG, "onAttachedToWindow: engineId not yet set, will init when set.")
            return
        }

        val manager = getSkiaManager()
        if (manager != null) {
            nativeInitPlatformContext(_engineId, manager)
            Log.i(TAG, "SkiaManager injected for engineId=$_engineId")
        } else {
            Log.e(TAG, "Could not get SkiaManager")
        }
    }

    /**
     * _platformContext field — giữ Java reference alive để tránh GC.
     * Không dùng trực tiếp nữa (C++ lấy từ JniSkiaManager),
     * nhưng vẫn cần giữ reference để JVM không GC.
     */
    private var _skiaManager: SkiaManager? = null

    /** Lấy SkiaManager đã được init đúng (qua RNSkiaModule.install()) */
    private fun getSkiaManager(): SkiaManager? {
        _skiaManager?.let { return it }
        return try {
            val reactContext = context as? ReactContext ?: return null

            val skiaModule = reactContext.getNativeModule(RNSkiaModule::class.java)
                ?: run {
                    Log.e(TAG, "RNSkiaModule not found in ReactContext")
                    return null
                }

            if (skiaModule.getSkiaManager() == null) {
                Log.i(TAG, "Calling RNSkiaModule.install() to initialize SkiaManager...")
                skiaModule.install()
            }

            val manager = skiaModule.getSkiaManager()
                ?: run {
                    Log.e(TAG, "SkiaManager still null after install()")
                    return null
                }

            _skiaManager = manager
            Log.i(TAG, "SkiaManager obtained for engineId=$_engineId")
            manager
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get SkiaManager: ${e.message}")
            null
        }
    }

    // kept for possible future use but no longer called directly
    @Suppress("unused")
    private fun getPlatformContextFromModule(): PlatformContext? = getSkiaManager()?.platformContext


    // ── SurfaceTextureListener ─────────────────────────────────────────────────

    override fun onSurfaceTextureAvailable(
        surface: SurfaceTexture, width: Int, height: Int
    ) {
        Log.i(TAG, "onSurfaceTextureAvailable: ${width}x${height}, engineId=$_engineId")
        if (_engineId < 0) {
            Log.w(TAG, "onSurfaceTextureAvailable: engineId not set yet, will attach when engineId arrives")
            return
        }
        nativeOnSurfaceAvailable(_engineId, surface, width, height)
    }

    override fun onSurfaceTextureSizeChanged(
        surface: SurfaceTexture, width: Int, height: Int
    ) {
        Log.i(TAG, "onSurfaceTextureSizeChanged: ${width}x${height}")
        if (_engineId < 0) return
        nativeOnSurfaceSizeChanged(_engineId, surface, width, height)
    }

    override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
        Log.i(TAG, "onSurfaceTextureDestroyed")
        if (_engineId >= 0) {
            nativeOnSurfaceDestroyed(_engineId)
        }
        return true
    }

    override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
        // Android gọi callback này khi SurfaceTexture nhận frame mới thành công.
        // Điều này có nghĩa là EGL context đã attach và GL thread đang hoạt động.
        // Dùng để reset EGL throttle và kick-start lại rendering nếu bị dừng.
        if (_engineId >= 0) {
            nativeScheduleRender(_engineId)
        }
    }

    // ── JNI Natives (tất cả nhận engineId để lookup đúng engine) ─────────────

    /**
     * nativeInitPlatformContext — truyền SkiaManager (Java) để C++ lấy
     * RNSkAndroidPlatformContext đã được init đúng từ JniSkiaManager::getPlatformContext().
     */
    private external fun nativeInitPlatformContext(engineId: Long, skiaManager: SkiaManager)

    private external fun nativeOnSurfaceAvailable(
        engineId: Long, surface: SurfaceTexture, width: Int, height: Int
    )

    private external fun nativeOnSurfaceSizeChanged(
        engineId: Long, surface: SurfaceTexture, width: Int, height: Int
    )

    private external fun nativeOnSurfaceDestroyed(engineId: Long)

    /** Reset EGL throttle và schedule 1 render frame — dùng sau khi EGL context sẵn sàng. */
    private external fun nativeScheduleRender(engineId: Long)

    companion object {
        private const val TAG = "SkiaKitNativeView"
    }
}
