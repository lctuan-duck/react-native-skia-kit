package com.margelo.nitro.skiakit

import android.content.Context
import android.graphics.SurfaceTexture
import android.view.TextureView
import android.view.ViewGroup
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.shopify.reactnative.skia.PlatformContext

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
                val ctx = getPlatformContextFromModule()
                if (ctx != null) {
                    nativeInitPlatformContext(_engineId, ctx)
                    nativeOnSurfaceAvailable(_engineId, st, w, h)
                } else {
                    Log.e(TAG, "setEngineId: PlatformContext null, cannot attach surface")
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

        // Lấy RNSkia PlatformContext và inject vào C++ engine
        val platformContext = getPlatformContextFromModule()
        if (platformContext != null) {
            nativeInitPlatformContext(_engineId, platformContext)
            Log.i(TAG, "PlatformContext injected for engineId=$_engineId")
        } else {
            Log.e(TAG, "Could not get PlatformContext from RNSkiaModule")
        }
    }

    /** 
     * PlatformContext field — tạo 1 lần và cache lại.
     *
     * PlatformContext.initHybrid() là JNI trong librnskia.so (do @shopify/react-native-skia cung cấp).
     * Library này phải được load trước bằng System.loadLibrary("rnskia").
     * RNSkiaModule thường load trong install() — nhưng trong Bridgeless mode,
     * getNativeModule() trả về null nên chúng ta không thể đợi RNSkiaModule.
     * Fix: load "rnskia" thủ công trước khi tạo PlatformContext.
     */
    private var _platformContext: PlatformContext? = null

    private fun getPlatformContextFromModule(): PlatformContext? {
        _platformContext?.let { return it }
        return try {
            val reactContext = context as? ReactContext ?: return null

            // BƯỚC 1: Thử lấy từ RNSkiaModule nếu đã được init (Bridge mode hoặc đã install())
            // Dùng reflection để tránh compile error khi RNSkiaModule không accessible
            try {
                val skiaModuleClass = Class.forName("com.shopify.reactnative.skia.RNSkiaModule")
                val getNativeModule = ReactContext::class.java.getMethod("getNativeModule", Class::class.java)
                val skiaModule = getNativeModule.invoke(reactContext, skiaModuleClass)
                if (skiaModule != null) {
                    val getSkiaManager = skiaModuleClass.getMethod("getSkiaManager")
                    val skiaManager = getSkiaManager.invoke(skiaModule)
                    if (skiaManager != null) {
                        val getPlatformContext = skiaManager.javaClass.getMethod("getPlatformContext")
                        val ctx = getPlatformContext.invoke(skiaManager) as? PlatformContext
                        if (ctx != null) {
                            Log.i(TAG, "PlatformContext obtained from RNSkiaModule")
                            _platformContext = ctx
                            return ctx
                        }
                    }
                }
            } catch (e: Exception) {
                Log.d(TAG, "RNSkiaModule not available (expected in Bridgeless): ${e.message}")
            }

            // BƯỚC 2: Load librnskia.so thủ công, sau đó tạo PlatformContext trực tiếp.
            // PlatformContext(ReactContext) chỉ cần display density — không cần bridge.
            try {
                System.loadLibrary("rnskia")
                Log.i(TAG, "librnskia.so loaded manually")
            } catch (e: UnsatisfiedLinkError) {
                Log.d(TAG, "librnskia.so already loaded (expected): ${e.message}")
                // Library đã được load bởi rnskia — tiếp tục tạo PlatformContext
            }

            val ctx = PlatformContext(reactContext)
            _platformContext = ctx
            Log.i(TAG, "PlatformContext created directly for engineId=$_engineId")
            ctx
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create PlatformContext: ${e.message}")
            null
        }
    }

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
        // C++ tự drive updates
    }

    // ── JNI Natives (tất cả nhận engineId để lookup đúng engine) ─────────────

    /**
     * nativeInitPlatformContext — inject RNSkia PlatformContext vào C++ engine.
     * engineId dùng để HybridUIEngine::findById() tìm đúng engine instance.
     */
    private external fun nativeInitPlatformContext(engineId: Long, platformContext: PlatformContext)

    private external fun nativeOnSurfaceAvailable(
        engineId: Long, surface: SurfaceTexture, width: Int, height: Int
    )

    private external fun nativeOnSurfaceSizeChanged(
        engineId: Long, surface: SurfaceTexture, width: Int, height: Int
    )

    private external fun nativeOnSurfaceDestroyed(engineId: Long)

    companion object {
        private const val TAG = "SkiaKitNativeView"
    }
}
