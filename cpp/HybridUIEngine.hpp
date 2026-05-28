#pragma once

#include "HybridUIEngineSpec.hpp"
#include "subsystems/HitTestSubsystem.hpp"
#include "subsystems/LayoutSubsystem.hpp"
#include "subsystems/RenderSubsystem.hpp"
#include "SkiaKitRenderer.hpp"
#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <unordered_map>

// Forward declare RNSkPlatformContext để tránh kéo toàn bộ RNSkia headers
namespace RNSkia { class RNSkPlatformContext; class RNSkCanvasProvider; }

namespace margelo::nitro::skiakit {

  class HybridUIEngine : public HybridUIEngineSpec {
  public:
    // Factory constructor — iOS: dùng _pendingPlatformContext nếu có
    HybridUIEngine() : HybridObject(TAG) {
      // Gán unique ID cho engine này
      _engineId = _sNextId.fetch_add(1, std::memory_order_relaxed);

      // Đăng ký vào global registry (dùng weak_ptr để không giữ alive)
      // NOTE: shared_from_this() chưa valid trong constructor — registry sẽ
      // được populate sau khi make_shared hoàn thành (xem registerSelf() bên dưới)

      // Wire text measuring: RenderSubsystem → LayoutSubsystem
      _layoutSubsystem.setMeasureCallback([this](const std::string& id, float w, int wm, float h, int hm) {
        return _renderSubsystem.measureText(id, w, wm, h, hm);
      });

      // iOS pattern: dùng pending context nếu có
      if (_pendingPlatformContext) {
        initWithPlatformContext(_pendingPlatformContext);
        _pendingPlatformContext = nullptr;
      }
    }

    ~HybridUIEngine() override {
      // Xóa khỏi registry khi bị destroy
      std::lock_guard<std::mutex> lock(_sRegistryMutex);
      _sRegistry.erase(_engineId);
    }

    // Gọi ngay sau make_shared() để đăng ký vào registry (shared_from_this() an toàn)
    void registerSelf(std::shared_ptr<HybridUIEngine> self) {
      std::lock_guard<std::mutex> lock(_sRegistryMutex);
      _sRegistry[_engineId] = self;
    }

    // Lookup engine theo ID — dùng bởi JNI/ObjC++ native views
    static std::shared_ptr<HybridUIEngine> findById(int64_t id) {
      std::lock_guard<std::mutex> lock(_sRegistryMutex);
      auto it = _sRegistry.find(id);
      if (it != _sRegistry.end()) {
        return it->second.lock();
      }
      return nullptr;
    }

    // ── Platform init ─────────────────────────────────────────────
    // Android: gọi trực tiếp từ JNI (có platformContext từ RNSkiaModule)
    // iOS:     gọi setPendingPlatformContext() từ SkiaKitInit.mm trước khi factory chạy
    void initWithPlatformContext(std::shared_ptr<RNSkia::RNSkPlatformContext> ctx);

    // iOS-specific: lưu context tạm thời để constructor dùng
    static void setPendingPlatformContext(
      std::shared_ptr<RNSkia::RNSkPlatformContext> ctx) {
      _pendingPlatformContext = std::move(ctx);
    }

    // Accessor cho JNI / platform layers
    std::shared_ptr<RNSkia::RNSkPlatformContext> getPlatformContext() const {
      return _platformContext;
    }

    // Attach/detach native canvas provider (gọi từ JNI/ObjC++ khi surface ready)
    void attachCanvasProvider(
      std::shared_ptr<RNSkia::RNSkCanvasProvider> provider,
      float width, float height
    );
    void detachNativeView() override;
    void resize(double width, double height) override;

    // Gọi từ onSurfaceTextureUpdated (JNI) khi EGL context đã sẵn sàng.
    // Reset EGL throttle và kick-start rendering sau khi bị dừng do EGL fail.
    void scheduleRenderFromSurface();

    // ── Hit-Test Subsystem ────────────────────────────────────────────────────
    void registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) override;
    void unregisterWidget(const std::string& id) override;
    void registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) override;
    std::vector<NativeHitResult> hitTest(double x, double y) override;

    // ── Layout Subsystem ──────────────────────────────────────────────────────
    void updateLayoutNode(const std::string& id, const NativeYogaStyle& style) override;
    void calculateLayout(const std::string& rootId, double width, double height) override;
    std::unordered_map<std::string, NativeLayoutRect> getAllLayouts() override;

    // ── Render Subsystem (v2) ─────────────────────────────────────────────────
    void initRenderEngine() override;

    void createBoxNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeBoxProps& props) override;
    void updateBoxNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeBoxProps& props) override;

    void createTextNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeTextProps& props) override;
    void updateTextNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeTextProps& props) override;

    void createImageNode(const std::string& id, const std::string& uri, const std::string& fit, double borderRadius) override;
    void updateImageNode(const std::string& id, const std::string& uri, const std::string& fit, double borderRadius) override;
    void startImageLoad(const std::string& id); // không override — đã remove khỏi spec

    void createIconNode(const std::string& id, const NativeYogaStyle& yogaStyle, const std::string& pathStr, double color, bool isStroke, double strokeWidth) override;
    void updateIconNode(const std::string& id, const NativeYogaStyle& yogaStyle, const std::string& pathStr, double color, bool isStroke, double strokeWidth) override;

    void createScrollNode(const std::string& id, bool horizontal, double contentPadding) override;
    void updateScrollNode(const std::string& id, bool horizontal, double contentPadding) override;
    void createScrollNodeFull(const std::string& id, const NativeYogaStyle& yogaStyle, bool horizontal, double contentPadding, double zIndex) override;

    void addRenderChild(const std::string& parentId, const std::string& childId) override;
    void insertRenderChildBefore(const std::string& parentId, const std::string& childId, const std::string& beforeChildId) override;
    void removeRenderChild(const std::string& parentId, const std::string& childId) override;
    void removeRenderNode(const std::string& id) override;

    void updateAnimatedStyles(const std::string& id, const NativeAnimatedStyle& style) override;
    void setScrollPosition(const std::string& id, double offset) override;
    void markDirty(const std::string& rootId) override;

    // ── Render Control ───────────────────────────────────────────────────────
    void scheduleLayoutAndRender() override;
    void beginCommit() override;
    void endCommit() override;

    // ── Engine Identity (Phase 3: multi-instance) ────────────────────────────
    double getEngineId() override;
    void onLayoutComplete(const std::function<void()>& callback) override;

  private:
    HitTestSubsystem _hitTestSubsystem;
    LayoutSubsystem  _layoutSubsystem;
    RenderSubsystem  _renderSubsystem;

    // C++ Autonomous Renderer (Phase 1+)
    std::shared_ptr<SkiaKitRenderer> _renderer;

    std::shared_ptr<RNSkia::RNSkPlatformContext> _platformContext;

    // Per-engine unique ID
    int64_t _engineId = -1;

    // JS callback được gọi sau mỗi layout cycle (từ onLayoutComplete)
    std::function<void()> _onLayoutCompleteJS;

    // ── Static: Global registry (multi-instance support) ─────────────────────
    static std::atomic<int64_t> _sNextId;
    static std::unordered_map<int64_t, std::weak_ptr<HybridUIEngine>> _sRegistry;
    static std::mutex _sRegistryMutex;

    // iOS init pattern: static pending context được set trước khi factory chạy
    static std::shared_ptr<RNSkia::RNSkPlatformContext> _pendingPlatformContext;

    // Chuyển đổi NativeBoxProps → BoxProps (internal)
    static BoxProps toBoxProps(const NativeBoxProps& p);
    // Chuyển đổi NativeTextProps → TextProps (internal)
    static TextProps toTextProps(const NativeTextProps& p);
  };

}
