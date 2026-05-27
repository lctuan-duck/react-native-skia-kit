#pragma once

#include "subsystems/RenderSubsystem.hpp"
#include "subsystems/LayoutSubsystem.hpp"
#include "subsystems/HitTestSubsystem.hpp"

#include "RNSkView.h"
#include "RNSkPlatformContext.h"

#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <string>

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

  bool isAttached() const;

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

  // Lock-free dedup: chỉ 1 render frame được schedule tại một thời điểm
  std::atomic<bool> _renderPending{false};
  // Guard: ngăn doRender() tự gọi đệ quy (paint → scheduleRender → doRender → ...)
  std::atomic<bool> _isRendering{false};
  // Flag: cần chạy calculateLayout trước khi draw
  std::atomic<bool> _needsLayout{false};

  // Bảo vệ _canvasProvider, _canvasId, _width, _height
  mutable std::mutex _providerMutex;

  // Callback để update JS layout SharedValues sau calculateLayout
  std::function<void()> _layoutUpdateCallback;
};

} // namespace margelo::nitro::skiakit
