#include "HybridUIEngine.hpp"

// Shopify Skia JSI canvas unwrapping
#include "api/JsiSkCanvas.h"

// RNSkPlatformContext — cần để loadAsync image
#include "RNSkPlatformContext.h"

namespace margelo::nitro::skiakit {

// Static member definition (iOS pending context pattern)
std::shared_ptr<RNSkia::RNSkPlatformContext> HybridUIEngine::_pendingPlatformContext;

  // ── Platform init ──────────────────────────────────────────────────────────

  void HybridUIEngine::initWithPlatformContext(
    std::shared_ptr<RNSkia::RNSkPlatformContext> ctx)
  {
    _platformContext = ctx;
    _renderSubsystem.initFontManager(ctx->createFontMgr());
  }

  void HybridUIEngine::initRenderEngine() {
    // FontMgr đã được set qua initWithPlatformContext.
    // Method này chỉ validate trạng thái (gọi từ JS để confirm engine sẵn sàng).
    // Nếu PlatformContext chưa được inject → log warning nhưng không crash.
  }

  // ── Hit-Test Subsystem ─────────────────────────────────────────────────────

  void HybridUIEngine::registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) {
    _hitTestSubsystem.registerWidget(id, x, y, w, h, zIndex, behavior);
  }
  void HybridUIEngine::unregisterWidget(const std::string& id) {
    _hitTestSubsystem.unregisterWidget(id);
  }
  void HybridUIEngine::setWidgetDynamic(const std::string& id, bool isDynamic) {
    _hitTestSubsystem.setWidgetDynamic(id, isDynamic);
  }
  void HybridUIEngine::registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) {
    _hitTestSubsystem.registerScrollArea(id, x, y, w, h, horizontal);
  }
  void HybridUIEngine::unregisterScrollArea(const std::string& id) {
    _hitTestSubsystem.unregisterScrollArea(id);
  }
  void HybridUIEngine::updateScrollOffset(const std::string& id, double offset) {
    _hitTestSubsystem.updateScrollOffset(id, offset);
  }
  std::vector<NativeHitResult> HybridUIEngine::hitTest(double x, double y) {
    return _hitTestSubsystem.hitTest(x, y);
  }
  void HybridUIEngine::clear() {
    _hitTestSubsystem.clear();
    _layoutSubsystem.clear();
  }

  // ── Layout Subsystem ───────────────────────────────────────────────────────

  void HybridUIEngine::updateLayoutNode(const std::string& id, const NativeYogaStyle& style) {
    _layoutSubsystem.updateLayoutNode(id, style);
  }
  void HybridUIEngine::removeLayoutNode(const std::string& id) {
    _layoutSubsystem.removeLayoutNode(id);
  }
  void HybridUIEngine::setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds) {
    _layoutSubsystem.setChildren(parentId, childrenIds);
  }
  void HybridUIEngine::calculateLayout(const std::string& rootId, double width, double height) {
    _layoutSubsystem.calculateLayout(rootId, width, height);

    // AUTO-BRIDGE 1: Layout → HitTest (needs ABSOLUTE positions for hit testing)
    auto allLayouts = _layoutSubsystem.getAllLayouts();
    for (const auto& [id, rect] : allLayouts) {
      _hitTestSubsystem.updateWidgetLayout(id, rect.x, rect.y, rect.width, rect.height);
    }

    // AUTO-BRIDGE 2: Layout → RenderSubsystem (needs RELATIVE positions for recursive canvas translate)
    auto relLayouts = _layoutSubsystem.getAllRelativeLayouts();
    std::unordered_map<std::string, CachedLayout> renderLayouts;
    renderLayouts.reserve(relLayouts.size());
    for (const auto& [id, rect] : relLayouts) {
      renderLayouts[id] = { static_cast<float>(rect.x), static_cast<float>(rect.y), static_cast<float>(rect.width), static_cast<float>(rect.height) };
    }
    _renderSubsystem.syncLayoutResults(renderLayouts);
  }
  NativeLayoutRect HybridUIEngine::getNodeLayout(const std::string& id) {
    return _layoutSubsystem.getNodeLayout(id);
  }
  std::unordered_map<std::string, NativeLayoutRect> HybridUIEngine::getAllLayouts() {
    return _layoutSubsystem.getAllLayouts();
  }

  // ── Render Subsystem ───────────────────────────────────────────────────────

  BoxProps HybridUIEngine::toBoxProps(const NativeBoxProps& p) {
    return {
      .backgroundColor = static_cast<uint32_t>(p.backgroundColor.value_or(0x00000000)),
      .borderRadius    = static_cast<float>(p.borderRadius.value_or(0)),
      .borderWidth     = static_cast<float>(p.borderWidth.value_or(0)),
      .borderColor     = static_cast<uint32_t>(p.borderColor.value_or(0xFF000000)),
      .elevation        = (float)p.elevation.value_or(0.0),
      .overflowHidden   = p.overflowHidden.value_or(false),
    };
  }

  TextProps HybridUIEngine::toTextProps(const NativeTextProps& p) {
    return {
      .content    = p.content,
      .fontSize   = static_cast<float>(p.fontSize.value_or(14)),
      .color      = static_cast<uint32_t>(p.color.value_or(0xFF000000)),
      .fontFamily = p.fontFamily.value_or(""),
      .fontWeight = (int)p.fontWeight.value_or(400),
      .maxLines   = (int)p.numberOfLines.value_or(0),
    };
  }

  void HybridUIEngine::createBoxNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeBoxProps& props) {
    // Layout node để LayoutSubsystem tính toán
    _layoutSubsystem.updateLayoutNode(id, yogaStyle);
    // Render node
    _renderSubsystem.createBoxNode(id, toBoxProps(props));
  }

  void HybridUIEngine::updateBoxNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeBoxProps& props) {
    _layoutSubsystem.updateLayoutNode(id, yogaStyle);
    _renderSubsystem.updateBoxNode(id, toBoxProps(props));
  }

  void HybridUIEngine::createTextNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeTextProps& props) {
    _layoutSubsystem.updateLayoutNode(id, yogaStyle);
    _renderSubsystem.createTextNode(id, toTextProps(props));
    
    // Register the measure function with Yoga (via LayoutSubsystem markDirty)
    _layoutSubsystem.markDirty(id);
  }

  void HybridUIEngine::updateTextNode(const std::string& id, const NativeYogaStyle& yogaStyle, const NativeTextProps& props) {
    _layoutSubsystem.updateLayoutNode(id, yogaStyle);
    _renderSubsystem.updateTextNode(id, toTextProps(props));
    _layoutSubsystem.markDirty(id);
  }

  void HybridUIEngine::createImageNode(const std::string& id, const std::string& uri) {
    _renderSubsystem.createImageNode(id, uri);
  }

  void HybridUIEngine::startImageLoad(const std::string& id) {
    if (_platformContext) {
      _renderSubsystem.startImageLoad(id, _platformContext);
    }
  }

  void HybridUIEngine::createIconNode(const std::string& id, const NativeYogaStyle& yogaStyle, const std::string& pathStr, double color, bool isStroke, double strokeWidth) {
    _layoutSubsystem.updateLayoutNode(id, yogaStyle);
    _renderSubsystem.createIconNode(id, pathStr, static_cast<uint32_t>(color), isStroke, (float)strokeWidth);
  }

  void HybridUIEngine::updateIconNode(const std::string& id, const NativeYogaStyle& yogaStyle, const std::string& pathStr, double color, bool isStroke, double strokeWidth) {
    _layoutSubsystem.updateLayoutNode(id, yogaStyle);
    _renderSubsystem.updateIconNode(id, pathStr, static_cast<uint32_t>(color), isStroke, (float)strokeWidth);
  }

  void HybridUIEngine::createScrollNode(const std::string& id, bool horizontal) {
    _layoutSubsystem.updateLayoutNode(id, {});  // Empty style — JS sẽ update sau
    _renderSubsystem.createScrollNode(id, horizontal);
  }

  void HybridUIEngine::addRenderChild(const std::string& parentId, const std::string& childId) {
    _renderSubsystem.addRenderChild(parentId, childId);
    // CRITICAL: Also link in Yoga layout tree so calculateLayout() knows the hierarchy
    _layoutSubsystem.addChild(parentId, childId);
  }

  void HybridUIEngine::removeRenderChild(const std::string& parentId, const std::string& childId) {
    _renderSubsystem.removeRenderChild(parentId, childId);
    _layoutSubsystem.removeChild(parentId, childId);
  }

  void HybridUIEngine::removeRenderNode(const std::string& id) {
    _renderSubsystem.removeRenderNode(id);
    _layoutSubsystem.removeLayoutNode(id);
  }

  void HybridUIEngine::syncLayoutResults(
    const std::unordered_map<std::string, NativeLayoutRect>& layouts)
  {
    // Được gọi từ JS nếu cần override — thông thường tự động qua calculateLayout()
    std::unordered_map<std::string, CachedLayout> renderLayouts;
    renderLayouts.reserve(layouts.size());
    for (const auto& [id, rect] : layouts) {
      renderLayouts[id] = { static_cast<float>(rect.x), static_cast<float>(rect.y), static_cast<float>(rect.width), static_cast<float>(rect.height) };
    }
    _renderSubsystem.syncLayoutResults(renderLayouts);
  }

  void HybridUIEngine::updateScrollNodeOffset(const std::string& id, double offset) {
    _renderSubsystem.updateScrollNodeOffset(id, (float)offset);
  }

  void HybridUIEngine::updateRenderNodeStyle(const std::string& id, double opacity) {
    _renderSubsystem.updateRenderNodeStyle(id, (float)opacity);
  }

  void HybridUIEngine::markDirty(const std::string& /*rootId*/) {
    _renderSubsystem.markDirty();
  }

  void HybridUIEngine::drawTree(
    const std::string& rootId,
    double w, double h)
  {
    // Phase 6E: Rebuild SkPicture với viewport size
    // JS gọi getRootPicture() để lấy bytes → Skia.MakePicture() → canvas.drawPicture()
    _renderSubsystem.markDirty();
  }

  std::shared_ptr<ArrayBuffer> HybridUIEngine::getRootPicture(const std::string& rootId, double w, double h) {
    auto bytes = _renderSubsystem.getPictureBytes(rootId, (float)w, (float)h);
    
    // Copy vector data to ArrayBuffer
    auto buffer = ArrayBuffer::allocate(bytes.size());
    std::memcpy(buffer->data(), bytes.data(), bytes.size());
    return buffer;
  }

  bool HybridUIEngine::hasPictureData() {
    return _renderSubsystem.hasPictureData();
  }

} // namespace margelo::nitro::skiakit
