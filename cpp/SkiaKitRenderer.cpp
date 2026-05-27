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
  // STACK OVERFLOW GUARD:
  // RenderNode::paint() có thể gọi scheduleRender() (qua onRequestRedraw) trong lúc
  // doRender() đang chạy trên main thread. runOnMainThread() trên Android thực thi
  // NGAY LẬP TỨC nếu đã ở trên main thread → doRender() đệ quy vô tận → SIGSEGV.
  //
  // Fix: nếu _isRendering=true, chỉ set _renderPending=true và return.
  // Sau khi doRender() hoàn tất, nó tự schedule thêm 1 frame nếu _renderPending=true.
  if (_isRendering.load(std::memory_order_acquire)) {
    _renderPending.store(true, std::memory_order_release);
    return;
  }

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
  } else {
    // EGL/surface không ready — mark layout dirty lại để retry khi surface available.
    _needsLayout.store(true, std::memory_order_release);
    RENDERER_LOG("renderToCanvas returned false (EGL not ready) — will retry on next dirty");
  }

  // ── Cleanup _isRendering và xử lý deferred scheduleRender ────────────────
  // Clear _isRendering TRƯỚC khi check _renderPending để tránh race condition
  // giữa 2 threads: nếu clear sau post-task, 1 thread khác có thể đã gọi
  // scheduleRender() và thấy _isRendering=true → không post → task bị mất.
  _isRendering.store(false, std::memory_order_release);

  // Nếu paint() hoặc bất kỳ callback nào đã set _renderPending=true trong lúc
  // chúng ta đang render (bị block bởi _isRendering guard), schedule 1 frame mới.
  // Dùng compare_exchange để tránh race với scheduleRender() từ thread khác.
  bool pendingAfterRender = true;
  if (_renderPending.compare_exchange_strong(pendingAfterRender, false,
        std::memory_order_acq_rel, std::memory_order_relaxed)) {
    // Có dirty request trong lúc render — schedule thêm 1 frame
    auto weakSelf = weak_from_this();
    _platformContext->runOnMainThread([weakSelf]() {
      if (auto self = weakSelf.lock()) {
        self->doRender();
      }
    });
  }
}

} // namespace margelo::nitro::skiakit
