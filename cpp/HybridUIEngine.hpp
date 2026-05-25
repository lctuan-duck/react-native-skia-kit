#pragma once

#include "HybridUIEngineSpec.hpp"
#include "subsystems/HitTestSubsystem.hpp"
#include "subsystems/LayoutSubsystem.hpp"
#include "subsystems/RenderSubsystem.hpp"
#include <memory>

// Forward declare RNSkPlatformContext để tránh kéo toàn bộ RNSkia headers
namespace RNSkia { class RNSkPlatformContext; }

namespace margelo::nitro::skiakit {

  class HybridUIEngine : public HybridUIEngineSpec {
  public:
    // Factory constructor — sử dụng pendingPlatformContext nếu có (iOS pattern)
    HybridUIEngine() : HybridObject(TAG) {
      if (_pendingPlatformContext) {
        initWithPlatformContext(_pendingPlatformContext);
        _pendingPlatformContext = nullptr;
      }
      
      // Wire up text measuring from RenderSubsystem to LayoutSubsystem
      _layoutSubsystem.setMeasureCallback([this](const std::string& id, float w, int wm, float h, int hm) {
        return _renderSubsystem.measureText(id, w, wm, h, hm);
      });
    }
    ~HybridUIEngine() override = default;

    // ── Platform init ─────────────────────────────────────────────
    // Android: gọi trực tiếp từ JNI_OnLoad factory lambda (có platformContext trong closure)
    // iOS:     gọi setPendingPlatformContext() từ SkiaKitInit.mm trước khi factory chạy
    void initWithPlatformContext(std::shared_ptr<RNSkia::RNSkPlatformContext> ctx);

    // iOS-specific: lưu context tạm thời để constructor dùng
    static void setPendingPlatformContext(
      std::shared_ptr<RNSkia::RNSkPlatformContext> ctx) {
      _pendingPlatformContext = std::move(ctx);
    }

    // ── Hit-Test Subsystem ────────────────────────────────────────────────────
    void registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) override;
    void unregisterWidget(const std::string& id) override;
    void setWidgetDynamic(const std::string& id, bool isDynamic) override;
    void registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) override;
    void unregisterScrollArea(const std::string& id) override;
    void updateScrollOffset(const std::string& id, double offset) override;
    std::vector<NativeHitResult> hitTest(double x, double y) override;
    void clear() override;

    // ── Layout Subsystem ──────────────────────────────────────────────────────
    void updateLayoutNode(const std::string& id, const NativeYogaStyle& style) override;
    void removeLayoutNode(const std::string& id) override;
    void setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds) override;
    void calculateLayout(const std::string& rootId, double width, double height) override;
    NativeLayoutRect getNodeLayout(const std::string& id) override;
    std::unordered_map<std::string, NativeLayoutRect> getAllLayouts() override;

    // ── Render Subsystem (v2) ─────────────────────────────────────────────────
    void initRenderEngine() override;

    void createBoxNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeBoxProps& props) override;
    void updateBoxNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeBoxProps& props) override;

    void createTextNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeTextProps& props) override;
    void updateTextNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeTextProps& props) override;

    void createImageNode(const std::string& id, const std::string& uri) override;
    void startImageLoad(const std::string& id) override;
    void createIconNode(const std::string& id, const NativeYogaStyle& yogaStyle, const std::string& pathStr, double color, bool isStroke, double strokeWidth) override;
    void updateIconNode(const std::string& id, const NativeYogaStyle& yogaStyle, const std::string& pathStr, double color, bool isStroke, double strokeWidth) override;
    void createScrollNode(const std::string& id, bool horizontal) override;

    void addRenderChild(const std::string& parentId, const std::string& childId) override;
    void insertRenderChildBefore(const std::string& parentId, const std::string& childId, const std::string& beforeChildId) override;
    void removeRenderChild(const std::string& parentId, const std::string& childId) override;
    void removeRenderNode(const std::string& id) override;

    void syncLayoutResults(const std::unordered_map<std::string, NativeLayoutRect>& layouts) override;
    void updateScrollNodeOffset(const std::string& id, double offset) override;
    void updateRenderNodeStyle(const std::string& id, double opacity) override;
    void markDirty(const std::string& rootId) override;
    void drawTree(const std::string& rootId, double w, double h) override;

    // Canvas Integration (Phase 6E)
    std::shared_ptr<ArrayBuffer> getRootPicture(const std::string& rootId, double w, double h) override;
    bool hasPictureData() override;

  private:
    HitTestSubsystem _hitTestSubsystem;
    LayoutSubsystem  _layoutSubsystem;
    RenderSubsystem  _renderSubsystem;

    std::shared_ptr<RNSkia::RNSkPlatformContext> _platformContext;

    // iOS init pattern: static pending context được set trước khi factory chạy
    static std::shared_ptr<RNSkia::RNSkPlatformContext> _pendingPlatformContext;

    // Chuyển đổi NativeBoxProps → BoxProps (internal)
    static BoxProps toBoxProps(const NativeBoxProps& p);
    // Chuyển đổi NativeTextProps → TextProps (internal)
    static TextProps toTextProps(const NativeTextProps& p);
  };

}
