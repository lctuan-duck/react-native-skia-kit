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
  // Reset EGL throttle — surface mới đã sẵn sàng, cho phép render ngay
  _eglFailCount.store(0, std::memory_order_release);
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
  // STACK OVERFLOW GUARD: nếu doRender() đang chạy, chỉ mark pending, không post task mới.
  if (_isRendering.load(std::memory_order_acquire)) {
    _renderPending.store(true, std::memory_order_release);
    return;
  }

  // EGL THROTTLE: nếu EGL đang fail liên tục, không post task mới lên main thread.
  // Reanimated animation gọi scheduleRender() 60fps — mỗi post → doRender() chạy trên main
  // thread → EGL fail → return → main thread 100% busy → UI freeze/unresponsive.
  // Fix: khi fail >= threshold, chỉ set _renderPending=true (không post).
  // Khi EGL recover: attachCanvasProvider → _eglFailCount=0 → scheduleLayoutAndRender()
  // sẽ bypass throttle và kick-start render lại ngay.
  constexpr int kMaxEglFailBeforeThrottle = 3;
  if (_eglFailCount.load(std::memory_order_relaxed) >= kMaxEglFailBeforeThrottle) {
    _renderPending.store(true, std::memory_order_release); // Nhớ có dirty request
    return; // Không post task — đợi EGL recover
  }

  // Lock-free dedup: chỉ 1 render frame được queue tại một thời điểm
  bool expected = false;
  if (!_renderPending.compare_exchange_strong(expected, true,
        std::memory_order_acq_rel, std::memory_order_relaxed)) {
    return; // Đã có task đang pending
  }

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
  // Set _isRendering TRƯỚC KHI reset _renderPending.
  // Bất kỳ scheduleRender() nào được gọi trong lúc đang render
  // sẽ thấy _isRendering=true và chỉ set _renderPending=true (không post task mới).
  _isRendering.store(true, std::memory_order_release);

  // Reset _renderPending để cho phép dirty updates trong lúc render
  // được schedule lại ngay sau khi frame này xong.
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
  bool didLayout = false;
  if (_needsLayout.exchange(false, std::memory_order_acq_rel)) {
    didLayout = true;
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
    // AUTO-BRIDGE 3 (JS notify) sẽ được fire SAU khi draw thành công (bên dưới)
  }

  // ── Step 2: Draw (Main Thread → GPU) ─────────────────────────────────
  // renderToCanvas trả về false nếu EGL surface không ready (e.g. TextureView
  // chưa attach GL context, đang scroll, hoặc surface bị mất).
  // QUAN TRỌNG: KHÔNG fire JS layoutUpdateCallback khi draw thất bại.
  // Nếu fire → JS update state → scheduleRender() → EGL fail → vòng lặp vô tận.
  bool rendered = provider->renderToCanvas([this, &canvasId, w, h](SkCanvas* canvas) {
    const float pd = _platformContext->getPixelDensity();
    canvas->save();
    canvas->scale(pd, pd);
    _renderSubsystem.drawTreeDirect(canvasId, canvas, w, h);
    canvas->restore();
  });

  if (rendered) {
    // Draw thành công → notify JS để update layout SharedValues
    if (didLayout && _layoutUpdateCallback) {
      auto cb = _layoutUpdateCallback;
      _platformContext->runOnJavascriptThread([cb]() {
        cb();
      });
    }
    _eglFailCount.store(0, std::memory_order_relaxed);
  } else {
    _eglFailCount.fetch_add(1, std::memory_order_relaxed);
    RENDERER_LOG("renderToCanvas returned false (EGL not ready), fail#%d — throttling after %d",
      _eglFailCount.load(std::memory_order_relaxed), 3);
  }

  // ── Cleanup _isRendering ────────────────────────────────────────────────
  _isRendering.store(false, std::memory_order_release);

  // Schedule frame tiếp theo nếu có dirty request từ bên ngoài.
  bool pendingAfterRender = true;
  if (_renderPending.compare_exchange_strong(pendingAfterRender, false,
        std::memory_order_acq_rel, std::memory_order_relaxed)) {
    scheduleRender(); // Sử dụng scheduleRender() để throttle logic được apply
  }
}

} // namespace margelo::nitro::skiakit
