#include "SkiaKitRenderer.hpp"

#ifdef __ANDROID__
#include <android/log.h>
#define RENDERER_LOG(...) __android_log_print(ANDROID_LOG_DEBUG, "SkiaKitRenderer", __VA_ARGS__)
#else
#define RENDERER_LOG(...) NSLog(@"[SkiaKitRenderer] " __VA_ARGS__)
#endif

namespace margelo::nitro::skiakit {

SkiaKitRenderer::SkiaKitRenderer(
  std::shared_ptr<RNSkia::RNSkPlatformContext> platformContext,
  RenderSubsystem&   renderSubsystem,
  LayoutSubsystem&   layoutSubsystem,
  HitTestSubsystem&  hitTestSubsystem
)
  : _platformContext(std::move(platformContext))
  , _renderSubsystem(renderSubsystem)
  , _layoutSubsystem(layoutSubsystem)
  , _hitTestSubsystem(hitTestSubsystem)
{}

// ── Lifecycle ──────────────────────────────────────────────────────────────

void SkiaKitRenderer::attachCanvasProvider(
  std::shared_ptr<RNSkia::RNSkCanvasProvider> provider,
  const std::string& canvasId,
  float width,
  float height
) {
  {
    std::lock_guard<std::mutex> lock(_providerMutex);
    _canvasProvider = std::move(provider);
    _canvasId       = canvasId;
    _width          = width;
    _height         = height;
  }
  RENDERER_LOG("attachCanvasProvider: canvasId=%s w=%.0f h=%.0f", canvasId.c_str(), width, height);

  // Initial render ngay sau khi attach
  scheduleLayoutAndRender();
}

void SkiaKitRenderer::detachCanvasProvider() {
  std::lock_guard<std::mutex> lock(_providerMutex);
  _canvasProvider = nullptr;
  _canvasId.clear();
  RENDERER_LOG("detachCanvasProvider");
}

void SkiaKitRenderer::resize(float width, float height) {
  {
    std::lock_guard<std::mutex> lock(_providerMutex);
    _width  = width;
    _height = height;
  }
  RENDERER_LOG("resize: w=%.0f h=%.0f", width, height);
  scheduleLayoutAndRender();
}

bool SkiaKitRenderer::isAttached() const {
  std::lock_guard<std::mutex> lock(_providerMutex);
  return _canvasProvider != nullptr;
}

// ── Scheduling ────────────────────────────────────────────────────────────

void SkiaKitRenderer::scheduleRender() {
  // Lock-free dedup: nếu đã pending thì bỏ qua, tránh queue nhiều frames
  bool expected = false;
  if (!_renderPending.compare_exchange_strong(expected, true,
        std::memory_order_acq_rel, std::memory_order_relaxed)) {
    return; // Đã có render đang được schedule
  }

  // Capture weak_ptr để tránh dangling pointer nếu renderer bị destroy
  auto weakSelf = weak_from_this();
  _platformContext->runOnMainThread([weakSelf]() {
    if (auto self = weakSelf.lock()) {
      self->doRender();
    }
  });
}

void SkiaKitRenderer::scheduleLayoutAndRender() {
  _needsLayout.store(true, std::memory_order_release);
  scheduleRender();
}

// ── doRender (Main Thread only) ───────────────────────────────────────────

void SkiaKitRenderer::doRender() {
  // Reset TRƯỚC khi render: cho phép dirty updates đến trong lúc render
  // được schedule lại ngay sau khi frame này xong
  _renderPending.store(false, std::memory_order_release);

  // Snapshot provider + dimensions dưới lock để tránh race với detach/resize
  std::shared_ptr<RNSkia::RNSkCanvasProvider> provider;
  std::string canvasId;
  float w, h;
  {
    std::lock_guard<std::mutex> lock(_providerMutex);
    provider  = _canvasProvider;
    canvasId  = _canvasId;
    w         = _width;
    h         = _height;
  }

  if (!provider || canvasId.empty() || w <= 0.f || h <= 0.f) {
    return; // Chưa attach hoặc đã detach
  }

  // ── Step 1: Layout (nếu cần) ──────────────────────────────────────────
  if (_needsLayout.exchange(false, std::memory_order_acq_rel)) {
    // calculateLayout là pure C++ Yoga computation — thread-safe vì chỉ
    // có doRender chạy trên Main Thread access layout subsystem theo cách này
    _layoutSubsystem.calculateLayout(canvasId, w, h);

    // AUTO-BRIDGE 1: Layout → HitTest (absolute positions cho hit testing)
    auto allLayouts = _layoutSubsystem.getAllLayouts();
    for (const auto& [id, rect] : allLayouts) {
      _hitTestSubsystem.updateWidgetLayout(
        id,
        rect.x.value_or(0),
        rect.y.value_or(0),
        rect.width,
        rect.height
      );
    }

    // AUTO-BRIDGE 2: Layout → RenderSubsystem (relative positions cho paint)
    auto relLayouts = _layoutSubsystem.getAllRelativeLayouts();
    std::unordered_map<std::string, CachedLayout> renderLayouts;
    renderLayouts.reserve(relLayouts.size());
    for (const auto& [id, rect] : relLayouts) {
      renderLayouts[id] = {
        static_cast<float>(rect.x.value_or(0)),
        static_cast<float>(rect.y.value_or(0)),
        static_cast<float>(rect.width),
        static_cast<float>(rect.height)
      };
    }
    _renderSubsystem.syncLayoutResults(renderLayouts);

    // AUTO-BRIDGE 3: Notify JS — update layout SharedValues
    // (cần thiết cho useNativeYogaLayout / ScrollView physics)
    // runOnJavascriptThread để JS thread gọi getAllLayouts() + updateLayoutSVs()
    if (_layoutUpdateCallback) {
      auto cb = _layoutUpdateCallback;
      _platformContext->runOnJavascriptThread([cb]() {
        cb();
      });
    }
  }

  // ── Step 2: Draw (Main Thread → GPU) ─────────────────────────────────
  provider->renderToCanvas([this, &canvasId, w, h](SkCanvas* canvas) {
    // Pixel density scale (HiDPI / Retina)
    const float pd = _platformContext->getPixelDensity();
    canvas->save();
    canvas->scale(pd, pd);

    // Vẽ trực tiếp qua SkPicture cache — không serialize, không ArrayBuffer
    _renderSubsystem.drawTreeDirect(canvasId, canvas, w, h);

    canvas->restore();
  });
}

} // namespace margelo::nitro::skiakit
