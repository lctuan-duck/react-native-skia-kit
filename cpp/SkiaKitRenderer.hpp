#pragma once

#include "subsystems/RenderSubsystem.hpp"
#include "subsystems/LayoutSubsystem.hpp"
#include "subsystems/HitTestSubsystem.hpp"

#include "RNSkView.h"
#include "RNSkPlatformContext.h"

#include <atomic>
#include <chrono>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <thread>  // std::this_thread::yield — cho beginCommit spin-wait

#ifdef __ANDROID__
#include <android/log.h>
#include <android/choreographer.h>  // AChoreographer VSync (API 24+)
#define _SKIA_TRACE(...) __android_log_print(ANDROID_LOG_DEBUG, "SkiaKitRenderer", __VA_ARGS__)
#else
#define _SKIA_TRACE(...)
#endif

namespace margelo::nitro::skiakit {

/**
 * SkiaKitRenderer — C++ Autonomous Render Engine.
 *
 * Thay thế toàn bộ JS-driven render loop:
 *   markDirty() → scheduleRender() → runOnMainThread → renderToCanvas → GPU
 *
 * Thread safety:
 *   - _renderPending (atomic<bool>): lock-free dedup, đảm bảo chỉ 1 render scheduled
 *   - _needsLayout (atomic<bool>): flag yêu cầu calculateLayout trước khi draw
 *   - _providerMutex: bảo vệ _canvasProvider khi attach/detach concurrent với doRender
 *   - RenderSubsystem._nodesMutex: bảo vệ node tree (đã có sẵn)
 *   - doRender() chỉ chạy trên Main Thread (do runOnMainThread đảm bảo)
 */
class SkiaKitRenderer : public std::enable_shared_from_this<SkiaKitRenderer> {
public:
  SkiaKitRenderer(
    std::shared_ptr<RNSkia::RNSkPlatformContext> platformContext,
    RenderSubsystem&   renderSubsystem,
    LayoutSubsystem&   layoutSubsystem,
    HitTestSubsystem&  hitTestSubsystem
  );

  ~SkiaKitRenderer() = default;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Attach một native canvas provider (surface đã sẵn sàng).
   * Gọi từ JNI (Android) hoặc ObjC++ (iOS) khi native surface available.
   * Thread-safe — có thể gọi từ bất kỳ thread nào.
   */
  void attachCanvasProvider(
    std::shared_ptr<RNSkia::RNSkCanvasProvider> provider,
    const std::string& canvasId,
    float width,
    float height
  );

  /**
   * Detach canvas provider — gọi khi native view bị unmount/destroy.
   * Thread-safe.
   */
  void detachCanvasProvider();

  /**
   * Resize — gọi khi screen rotate hoặc view bounds thay đổi.
   * Schedule layout + render lại.
   * Thread-safe.
   */
  void resize(float width, float height);

  bool isAttached() const {
    std::lock_guard<std::mutex> lock(_providerMutex);
    return _canvasProvider != nullptr;
  }

  // Reset EGL throttle counter — gọi khi EGL context xác nhận sẵn sàng
  // (via onSurfaceTextureUpdated callback từ Android)
  void resetEglThrottle() {
    _eglFailCount.store(0, std::memory_order_release);
    _eglThrottleStartNs.store(0, std::memory_order_relaxed);
  }

  // ── Render scheduling ────────────────────────────────────────────────────

  /**
   * scheduleRender — Schedule 1 render frame lên Main Thread.
   * Lock-free dedup: nếu đã có render pending → skip (không queue thêm).
   * Thread-safe — có thể gọi từ bất kỳ thread nào (JS, Worklet, Background).
   *
   * Dùng khi: scroll offset thay đổi, animation update, image load xong.
   */
  void scheduleRender();

  /**
   * scheduleLayoutAndRender — Schedule layout recalculate + render.
   * Dùng khi: Reconciler commit (node thêm/xóa/cập nhật props/yoga style).
   * Thread-safe.
   */
  void scheduleLayoutAndRender();

  /**
   * beginCommit — Gọi từ reconciler's prepareForCommit.
   * Ngăn tất cả renders trong khi reconciler đang commit partial state.
   * Mọi scheduleRender() sẽ chỉ set _renderPending, không post lên main thread.
   */
  void beginCommit() {
    // SPIN-WAIT: Chờ doRender hoàn thành trước khi reconciler mutate render tree.
    //
    // Data race: doRender (main thread) đọc render tree trong drawTreeDirect,
    // beginCommit (JS thread) bắt đầu mutations (addRenderChild/removeRenderNode).
    // Nếu chạy đồng thời → undefined behavior → crash/corruption.
    //
    // Fix: spin-wait với timeout 50ms. JS thread có thể tạm dừng ngắn.
    // doRender hoàn thành trong ~10-20ms nên timeout hiếm khi xảy ra.
    // Không dùng mutex để tránh priority inversion (JS thread > main thread).
    auto deadline = std::chrono::steady_clock::now() + std::chrono::milliseconds(50);
    while (_isRendering.load(std::memory_order_acquire)) {
      if (std::chrono::steady_clock::now() > deadline) {
        // Timeout: render quá lâu (> 50ms), bỏ qua để tránh JS deadlock.
        break;
      }
      std::this_thread::yield();
    }
    _commitActive.store(true, std::memory_order_release);
    _SKIA_TRACE("beginCommit: commitActive=true, isRendering=%d, renderPending=%d",
      (int)_isRendering.load(std::memory_order_relaxed),
      (int)_renderPending.load(std::memory_order_relaxed));
  }

  /**
   * endCommit — Gọi từ reconciler's resetAfterCommit.
   * Mở khóa rendering VÀ ngay lập tức schedule layout+render.
   */
  void endCommit() {
    // Reset EGL throttle.
    _eglFailCount.store(0, std::memory_order_release);
    _eglThrottleStartNs.store(0, std::memory_order_relaxed);
    _commitActive.store(false, std::memory_order_release);
    //
    // FIX FLICKER: KHÔNG force-reset _renderPending=false.
    //
    // Vấn đề cũ: force-reset → scheduleRender → N commits → N CAS thành công
    // → N Choreographer callbacks đăng ký → N doRenders trên các VSync khác nhau
    // → render partial tree giữa các commits → FLICKER ở góc trái.
    //
    // Fix mới: chỉ set _renderPending=true (mark dirty) + dùng _choreographerRegistered
    // để đảm bảo chỉ CÓ MỘT Choreographer callback được đăng ký cho toàn bộ batch.
    // Mọi commits trong cùng 1 frame (16ms) → chỉ 1 callback → 1 doRender với FINAL state.
    _needsLayout.store(true, std::memory_order_release);
    _renderPending.store(true, std::memory_order_release);
    _SKIA_TRACE("endCommit: commitActive=false, eglThrottle reset, marking dirty");
    scheduleChoreographerFrame();
  }

  /**
   * scheduleChoreographerFrame — Đăng ký 1 Choreographer VSync callback.
   * Deduplicated bởi _choreographerRegistered: dù gọi N lần, chỉ 1 callback được đăng ký.
   * Gọi được từ bất kỳ thread nào.
   */
  void scheduleChoreographerFrame();

  // ── Layout update callback ────────────────────────────────────────────────

  /**
   * setLayoutUpdateCallback — JS callback để update SharedValues layout.
   * Được gọi sau mỗi calculateLayout để useNativeYogaLayout hoạt động.
   * Cần thiết cho ScrollView physics (viewportSize, contentSize).
   */
  void setLayoutUpdateCallback(std::function<void()> cb) {
    _layoutUpdateCallback = std::move(cb);
  }

private:
  /**
   * doRender — Thực sự render frame.
   * LUÔN chạy trên Main Thread (được đảm bảo bởi runOnMainThread).
   * Bao gồm: calculateLayout (nếu cần) → syncLayouts → drawTree → GPU flush.
   */
  void doRender();

  std::shared_ptr<RNSkia::RNSkPlatformContext> _platformContext;
  RenderSubsystem&  _renderSubsystem;
  LayoutSubsystem&  _layoutSubsystem;
  HitTestSubsystem& _hitTestSubsystem;

  // Canvas provider — backed bởi native GPU surface (OpenGL/Metal)
  std::shared_ptr<RNSkia::RNSkCanvasProvider> _canvasProvider;
  std::string _canvasId;
  float _width  = 0.f;
  float _height = 0.f;

  // _renderPending: có content dirty cần render (set bởi animation worklet, commit, v.v.)
  // KHÔNG dùng để dedup Choreographer — xem _choreographerRegistered.
  std::atomic<bool> _renderPending{false};
  // _choreographerRegistered: đã có Choreographer callback được đăng ký chưa.
  // Tách biệt khỏi _renderPending để tránh:
  //   - N endCommits → N Choreographer callbacks → N renders (flicker / waste)
  //   - Choreographer callback không được re-register khi animation tiếp tục
  std::atomic<bool> _choreographerRegistered{false};
  // Guard: ngăn doRender() tự gọi đệ quy (paint → scheduleRender → doRender → ...)
  std::atomic<bool> _isRendering{false};
  // EGL throttle: đếm số lần renderToCanvas() trả về false liên tiếp.
  std::atomic<int> _eglFailCount{0};
  // Thời điểm bắt đầu EGL throttle (nanoseconds kể từ epoch, 0 = chưa throttle)
  std::atomic<int64_t> _eglThrottleStartNs{0};
  // Flag: cần chạy calculateLayout trước khi draw
  std::atomic<bool> _needsLayout{false};
  // Commit batch guard: khi reconciler đang commit, block scheduleRender().
  std::atomic<bool> _commitActive{false};

  // Bảo vệ _canvasProvider, _canvasId, _width, _height
  mutable std::mutex _providerMutex;

  // Callback để update JS layout SharedValues sau calculateLayout
  std::function<void()> _layoutUpdateCallback;
};

} // namespace margelo::nitro::skiakit
