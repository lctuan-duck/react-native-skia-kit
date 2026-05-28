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
  _eglThrottleStartNs.store(0, std::memory_order_relaxed); // reset timer
  RENDERER_LOG("attachCanvasProvider: canvasId=%s w=%.0f h=%.0f", canvasId.c_str(), width, height);

  // BUG-1 FIX: Chỉ scheduleLayoutAndRender nếu tree đã có content.
  // Nếu gọi ngay khi surface attach nhưng JS reconciler chưa commit xong
  // → render cây rỗng → thấy partial UI ở góc trái (flicker khi chuyển tab).
  // JS reconciler's resetAfterCommit sẽ tự gọi scheduleLayoutAndRender sau khi commit.
  if (_renderSubsystem.hasRenderContent(canvasId)) {
    scheduleLayoutAndRender();
  }
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

// ── Scheduling ────────────────────────────────────────────────────────────

void SkiaKitRenderer::scheduleRender() {
  // COMMIT BATCH GUARD: nếu reconciler đang commit partial tree → chỉ mark dirty.
  // endCommit() sẽ gọi scheduleChoreographerFrame() sau khi commit xong.
  if (_commitActive.load(std::memory_order_acquire)) {
    _renderPending.store(true, std::memory_order_release);
    return;
  }

  // RENDER-IN-PROGRESS GUARD: doRender đang chạy → mark dirty.
  // Cuối doRender sẽ tự re-register Choreographer nếu pending.
  if (_isRendering.load(std::memory_order_acquire)) {
    _renderPending.store(true, std::memory_order_release);
    return;
  }

  // EGL THROTTLE: tránh busy-loop khi EGL chưa sẵn sàng.
  constexpr int kMaxEglFailBeforeThrottle = 5;
  int currentFails = _eglFailCount.load(std::memory_order_relaxed);
  if (currentFails >= kMaxEglFailBeforeThrottle) {
    int64_t startNs = _eglThrottleStartNs.load(std::memory_order_relaxed);
    bool pastTimeout = false;
    if (startNs != 0) {
      auto now = std::chrono::steady_clock::now();
      int64_t nowNs = std::chrono::duration_cast<std::chrono::nanoseconds>(
        now.time_since_epoch()).count();
      pastTimeout = ((nowNs - startNs) > 1'000'000'000LL);
    }
    if (pastTimeout) {
      RENDERER_LOG("EGL throttle recovery: resetting after 1s");
      _eglFailCount.store(0, std::memory_order_release);
      _eglThrottleStartNs.store(0, std::memory_order_relaxed);
    } else {
      _renderPending.store(true, std::memory_order_release);
      return;
    }
  }

  // Mark dirty + đăng ký Choreographer (deduplicated).
  _renderPending.store(true, std::memory_order_release);
  scheduleChoreographerFrame();
}

void SkiaKitRenderer::scheduleChoreographerFrame() {
  // Deduplicate: chỉ 1 Choreographer callback được đăng ký tại một thời điểm.
  // Dùng _choreographerRegistered riêng biệt thay vì _renderPending để:
  // 1. FLICKER FIX: N endCommits → 1 callback duy nhất → 1 doRender với FINAL tree state.
  // 2. ANIMATION FIX: cuối doRender có thể re-register cho frame tiếp theo
  //    mà không conflict với _renderPending (animation continuity).
  bool expected = false;
  if (!_choreographerRegistered.compare_exchange_strong(expected, true,
        std::memory_order_acq_rel, std::memory_order_relaxed)) {
    // Đã có callback pending — không cần đăng ký thêm.
    // _renderPending đã được set → callback hiện tại sẽ render khi VSync fires.
    return;
  }

#ifdef __ANDROID__
  RENDERER_LOG("scheduleChoreographerFrame: registering VSync callback");
  auto weakSelf = weak_from_this();
  _platformContext->runOnMainThread([weakSelf]() {
    AChoreographer* choreographer = AChoreographer_getInstance();
    if (!choreographer) {
      RENDERER_LOG("scheduleChoreographerFrame: AChoreographer unavailable, fallback");
      if (auto self = weakSelf.lock()) {
        self->_choreographerRegistered.store(false, std::memory_order_release);
        self->doRender();
      }
      return;
    }
    AChoreographer_postFrameCallback(
      choreographer,
      [](long frameTimeNanos, void* data) {
        auto* weakPtr = static_cast<std::weak_ptr<SkiaKitRenderer>*>(data);
        if (auto self = weakPtr->lock()) {
          RENDERER_LOG("VSync fired (frame=%ldns)", frameTimeNanos);
          // _choreographerRegistered sẽ được clear TRONG doRender trước khi render.
          self->doRender();
        }
        delete weakPtr;
      },
      new std::weak_ptr<SkiaKitRenderer>(weakSelf)
    );
  });
#else
  RENDERER_LOG("scheduleChoreographerFrame: posting to main thread (iOS)");
  auto weakSelf = weak_from_this();
  _platformContext->runOnMainThread([weakSelf]() {
    if (auto self = weakSelf.lock()) {
      self->_choreographerRegistered.store(false, std::memory_order_release);
      self->doRender();
    }
  });
#endif
}

void SkiaKitRenderer::scheduleLayoutAndRender() {
  _needsLayout.store(true, std::memory_order_release);
  scheduleRender();
}

// ── doRender (Main Thread only) ───────────────────────────────────────────

void SkiaKitRenderer::doRender() {
  // ── Guard 1: Commit Safety ────────────────────────────────────────────────
  // Nếu doRender task được queue BEFORE beginCommit() nhưng chạy AFTER reconciler
  // bắt đầu mutate tree → data race trên render tree → undefined behavior.
  // Bail out: endCommit() sẽ force-reset _renderPending=false rồi gọi
  // scheduleLayoutAndRender() → CAS(false→true) → post fresh doRender task.
  //
  // QUAN TRỌNG: KHÔNG set _renderPending=true ở đây!
  // Nếu set true: endCommit→scheduleRender thấy pending=true → CAS fail
  // → không post task mới → FROZEN FOREVER.
  if (_commitActive.load(std::memory_order_acquire)) {
    // Guard 1: commit đang chạy → clear _choreographerRegistered để endCommit
    // có thể re-register callback sau khi commit xong. KHÔNG set _renderPending=true
    // vì endCommit sẽ set nó trong scheduleChoreographerFrame.
    _choreographerRegistered.store(false, std::memory_order_release);
    return;
  }

  // ── Guard 2: RAII _isRendering ────────────────────────────────────────────
  // Đảm bảo _isRendering luôn được reset kể cả khi drawTreeDirect() throw C++
  // exception. Nếu không có RAII: exception → stack unwind → _isRendering stuck
  // = true → mọi scheduleRender() sau đó đều bị block → FREEZE FOREVER.
  struct IsRenderingGuard {
    std::atomic<bool>& _flag;
    std::atomic<bool>& _pending;
    bool _needsReschedule = false;
    explicit IsRenderingGuard(std::atomic<bool>& f, std::atomic<bool>& p)
      : _flag(f), _pending(p) {
      _flag.store(true, std::memory_order_release);
    }
    ~IsRenderingGuard() {
      _flag.store(false, std::memory_order_release);
      // Nếu bị exception, reschedule để không mất render request
      if (_needsReschedule) {
        _pending.store(true, std::memory_order_release);
      }
    }
  } renderGuard(_isRendering, _renderPending);
  // Mặc định nếu exception → reschedule. Sẽ clear flag khi render thành công.
  renderGuard._needsReschedule = true;

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
  bool anyLayoutChanged = false; // FIX M4: track xem layout có thực sự thay đổi không
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
    // syncLayoutResults returns true nếu có node nào thực sự thay đổi position/size
    anyLayoutChanged = _renderSubsystem.syncLayoutResults(renderLayouts);
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
    RENDERER_LOG("doRender: draw w=%.0f h=%.0f pd=%.2f", w, h, pd);
    _renderSubsystem.drawTreeDirect(canvasId, canvas, w, h);
    canvas->restore();
  });

  if (rendered) {
    // FIX M4: Chỉ fire JS layout callback khi layout THỰC SỰ thay đổi.
    // Tránh JSI roundtrip + Reanimated SharedValues update vô ích mỗi frame tĩnh.
    if (didLayout && anyLayoutChanged && _layoutUpdateCallback) {
      auto cb = _layoutUpdateCallback;
      _platformContext->runOnJavascriptThread([cb]() {
        cb();
      });
    }
    _eglFailCount.store(0, std::memory_order_relaxed);
    _eglThrottleStartNs.store(0, std::memory_order_relaxed);
  } else {
    // FIX C4: Nếu draw thất bại (EGL not ready) nhưng layout đã được tính,
    // re-queue layout để lần render tiếp theo không dùng layout stale.
    if (didLayout) {
      _needsLayout.store(true, std::memory_order_release);
    }
    int newFails = _eglFailCount.fetch_add(1, std::memory_order_relaxed) + 1;
    RENDERER_LOG("renderToCanvas returned false (EGL not ready), fail#%d", newFails);
    if (newFails == 5) {
      auto now = std::chrono::steady_clock::now();
      int64_t nowNs = std::chrono::duration_cast<std::chrono::nanoseconds>(
        now.time_since_epoch()).count();
      _eglThrottleStartNs.store(nowNs, std::memory_order_relaxed);
      RENDERER_LOG("EGL throttle started — will auto-recover after 1s");
    }
  }

  // ── RAII Cleanup ─────────────────────────────────────────────────────────
  // Xóa _choreographerRegistered TRƯỚC KHI check _renderPending.
  // Điều này cho phép scheduleChoreographerFrame() bên dưới đăng ký callback mới
  // ngay trong lần gọi này (không bị block bởi CAS _choreographerRegistered=true).
  _choreographerRegistered.store(false, std::memory_order_release);
  renderGuard._needsReschedule = false; // Normal completion.

  // Re-register Choreographer cho frame tiếp theo nếu còn dirty.
  // ANIMATION CONTINUITY FIX:
  //   - Animation worklet → scheduleRender() → set _renderPending=true (trong lúc isRendering=true → skip)
  //   - Cuối doRender: _renderPending=true → scheduleChoreographerFrame() → register next VSync
  //   - Kể cả khi slider bị held (không move), animation vẫn tự duy trì vòng lặp này.
  //
  // KHÁC VỚI TRƯỚC: trước đây dùng CAS(_renderPending, true→false) nên nếu
  // animation set _renderPending=true trong lúc render, nó bị swap về false → animation dừng.
  if (_renderPending.load(std::memory_order_acquire)) {
    scheduleChoreographerFrame(); // CAS _choreographerRegistered: false→true → register VSync
  }
}

} // namespace margelo::nitro::skiakit
