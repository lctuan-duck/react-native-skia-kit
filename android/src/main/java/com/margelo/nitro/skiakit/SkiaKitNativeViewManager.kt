package com.margelo.nitro.skiakit

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * SkiaKitNativeViewManager — React Native ViewManager cho SkiaKitNativeView.
 *
 * Phase 3: Thêm `engineId` prop — JS truyền unique engine ID xuống để
 * native view tìm đúng HybridUIEngine instance từ global registry.
 */
class SkiaKitNativeViewManager : SimpleViewManager<SkiaKitNativeView>() {

    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): SkiaKitNativeView {
        return SkiaKitNativeView(context)
    }

    /**
     * engineId — nhận unique engine ID từ JS CanvasRoot.
     * JS: uiEngine.getEngineId() → <SkiaKitNativeView engineId={id} />
     * Manager: gọi view.setEngineId(id.toLong())
     */
    @ReactProp(name = "engineId")
    fun setEngineId(view: SkiaKitNativeView, engineId: Double) {
        view.setEngineId(engineId.toLong())
    }

    companion object {
        const val NAME = "SkiaKitNativeView"
    }
}
