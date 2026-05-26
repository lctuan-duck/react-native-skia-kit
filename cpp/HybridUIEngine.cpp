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
      _hitTestSubsystem.updateWidgetLayout(id, rect.x.value_or(0), rect.y.value_or(0), rect.width, rect.height);
    }

    // AUTO-BRIDGE 2: Layout → RenderSubsystem (needs RELATIVE positions for recursive canvas translate)
    auto relLayouts = _layoutSubsystem.getAllRelativeLayouts();
    std::unordered_map<std::string, CachedLayout> renderLayouts;
    renderLayouts.reserve(relLayouts.size());
    for (const auto& [id, rect] : relLayouts) {
      renderLayouts[id] = { static_cast<float>(rect.x.value_or(0)), static_cast<float>(rect.y.value_or(0)), static_cast<float>(rect.width), static_cast<float>(rect.height) };
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
    BoxProps result = {
      .backgroundColor         = static_cast<uint32_t>(p.backgroundColor.value_or(0x00000000)),
      
      .borderRadius            = static_cast<float>(p.borderRadius.value_or(0)),
      .borderTopLeftRadius     = static_cast<float>(p.borderTopLeftRadius.value_or(-1)),
      .borderTopRightRadius    = static_cast<float>(p.borderTopRightRadius.value_or(-1)),
      .borderBottomRightRadius = static_cast<float>(p.borderBottomRightRadius.value_or(-1)),
      .borderBottomLeftRadius  = static_cast<float>(p.borderBottomLeftRadius.value_or(-1)),
      
      .borderWidth             = static_cast<float>(p.borderWidth.value_or(0)),
      .borderTopWidth          = static_cast<float>(p.borderTopWidth.value_or(-1)),
      .borderRightWidth        = static_cast<float>(p.borderRightWidth.value_or(-1)),
      .borderBottomWidth       = static_cast<float>(p.borderBottomWidth.value_or(-1)),
      .borderLeftWidth         = static_cast<float>(p.borderLeftWidth.value_or(-1)),
      
      .borderColor             = static_cast<uint32_t>(p.borderColor.value_or(0x00000000)),
      .borderTopColor          = static_cast<uint32_t>(p.borderTopColor.value_or(0)),
      .borderRightColor        = static_cast<uint32_t>(p.borderRightColor.value_or(0)),
      .borderBottomColor       = static_cast<uint32_t>(p.borderBottomColor.value_or(0)),
      .borderLeftColor         = static_cast<uint32_t>(p.borderLeftColor.value_or(0)),
      
      .borderStyle             = p.borderStyle.value_or("solid"),
      .dashLength              = static_cast<float>(p.dashLength.value_or(-1)),
      .dashSpacing             = static_cast<float>(p.dashSpacing.value_or(-1)),

      .elevation               = static_cast<float>(p.elevation.value_or(0.0)),
      
      .shadowColor             = static_cast<uint32_t>(p.shadowColor.value_or(0x00000000)),
      .shadowOffsetX           = static_cast<float>(p.shadowOffsetX.value_or(0)),
      .shadowOffsetY           = static_cast<float>(p.shadowOffsetY.value_or(0)),
      .shadowBlur              = static_cast<float>(p.shadowBlur.value_or(0)),
      .shadowOpacity           = static_cast<float>(p.shadowOpacity.value_or(1.0)),
      .shadowSpread            = static_cast<float>(p.shadowSpread.value_or(0)),
      .shadowType              = p.shadowType.value_or("outer"),
      
      .overflowHidden          = p.overflowHidden.value_or(false),
    };

    // Phase 3: Gradient
    if (p.gradient.has_value()) {
      const auto& g = p.gradient.value();
      GradientData gd;
      if (g.type == "linear")      gd.type = GradientType::Linear;
      else if (g.type == "radial") gd.type = GradientType::Radial;
      else if (g.type == "sweep")  gd.type = GradientType::Sweep;

      gd.colors = std::vector<SkColor>(g.colors.begin(), g.colors.end());
      if (g.positions.has_value()) {
        gd.positions = std::vector<SkScalar>(g.positions.value().begin(), g.positions.value().end());
      }
      gd.startX  = static_cast<float>(g.startX.value_or(0.f));
      gd.startY  = static_cast<float>(g.startY.value_or(0.5f));
      gd.endX    = static_cast<float>(g.endX.value_or(1.f));
      gd.endY    = static_cast<float>(g.endY.value_or(0.5f));
      gd.centerX = static_cast<float>(g.centerX.value_or(0.5f));
      gd.centerY = static_cast<float>(g.centerY.value_or(0.5f));
      gd.radius  = static_cast<float>(g.radius.value_or(0.5f));
      gd.startAngle = static_cast<float>(g.startAngle.value_or(0.f));
      gd.endAngle   = static_cast<float>(g.endAngle.value_or(360.f));
      if (g.tileMode.has_value()) gd.tileMode = parseTileMode(g.tileMode.value());
      result.gradient = gd;
    }

    // Phase 3: Backdrop blur
    result.backdropBlurRadius = static_cast<float>(p.backdropBlurRadius.value_or(0.f));

    // Phase 3: Blend mode
    if (p.blendMode.has_value()) {
      result.blendMode = parseBlendMode(p.blendMode.value());
    }

    // Phase 3: Color filter matrix
    if (p.colorFilter.has_value()) {
      result.colorFilter = std::vector<float>(
        p.colorFilter.value().begin(),
        p.colorFilter.value().end()
      );
    }

    return result;
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

  void HybridUIEngine::createImageNode(const std::string& id, const std::string& uri, const std::string& fit, double borderRadius) {
    _renderSubsystem.createImageNode(id, uri);
  }
  
  void HybridUIEngine::updateImageNode(const std::string& id, const std::string& uri, const std::string& fit, double borderRadius) {
    // Tạm thời chưa xử lý update image
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

  void HybridUIEngine::createScrollNode(const std::string& id, bool horizontal, double contentPadding) {
    _layoutSubsystem.updateLayoutNode(id, {});  // Empty style — JS sẽ update sau
    _renderSubsystem.createScrollNode(id, horizontal);
  }

  void HybridUIEngine::updateScrollNode(const std::string& id, bool horizontal, double contentPadding) {
    // Tạm thời chưa xử lý update layout contentPadding
  }

  void HybridUIEngine::addRenderChild(const std::string& parentId, const std::string& childId) {
    _renderSubsystem.addRenderChild(parentId, childId);
    // CRITICAL: Also link in Yoga layout tree so calculateLayout() knows the hierarchy
    _layoutSubsystem.addChild(parentId, childId);
  }

  void HybridUIEngine::insertRenderChildBefore(const std::string& parentId, const std::string& childId, const std::string& beforeChildId) {
    _renderSubsystem.insertRenderChildBefore(parentId, childId, beforeChildId);
    _layoutSubsystem.insertChildBefore(parentId, childId, beforeChildId);
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
      renderLayouts[id] = { static_cast<float>(rect.x.value_or(0)), static_cast<float>(rect.y.value_or(0)), static_cast<float>(rect.width), static_cast<float>(rect.height) };
    }
    _renderSubsystem.syncLayoutResults(renderLayouts);
  }

  void HybridUIEngine::updateAnimatedStyles(const std::string& id, const NativeAnimatedStyle& style) {
    // 1. Cập nhật Render properties (Transform, Opacity, Colors, v.v...)
    _renderSubsystem.updateAnimatedStyles(id, style);
    
    if (style.pointerEvents.has_value()) {
      _hitTestSubsystem.updatePointerEvents(id, style.pointerEvents.value());
    }

    // 2. Phân loại Paint vs Layout-Affecting properties
    bool isLayoutAffecting = false;
    NativeYogaStyle layoutStyle;

    if (style.width.has_value()) { layoutStyle.width = style.width; isLayoutAffecting = true; }
    if (style.height.has_value()) { layoutStyle.height = style.height; isLayoutAffecting = true; }
    // margin/padding is handled by explicit layout props in YogaStyle
    // No direct mapping available for shorthand margin/padding in NativeYogaStyle.
    if (style.marginTop.has_value()) { layoutStyle.marginTop = style.marginTop; isLayoutAffecting = true; }
    if (style.marginRight.has_value()) { layoutStyle.marginRight = style.marginRight; isLayoutAffecting = true; }
    if (style.marginBottom.has_value()) { layoutStyle.marginBottom = style.marginBottom; isLayoutAffecting = true; }
    if (style.marginLeft.has_value()) { layoutStyle.marginLeft = style.marginLeft; isLayoutAffecting = true; }
    // No direct mapping for shorthand padding either.
    if (style.paddingTop.has_value()) { layoutStyle.paddingTop = style.paddingTop; isLayoutAffecting = true; }
    if (style.paddingRight.has_value()) { layoutStyle.paddingRight = style.paddingRight; isLayoutAffecting = true; }
    if (style.paddingBottom.has_value()) { layoutStyle.paddingBottom = style.paddingBottom; isLayoutAffecting = true; }
    if (style.paddingLeft.has_value()) { layoutStyle.paddingLeft = style.paddingLeft; isLayoutAffecting = true; }
    if (style.flex.has_value()) { layoutStyle.flex = style.flex; isLayoutAffecting = true; }
    if (style.flexGrow.has_value()) { layoutStyle.flexGrow = style.flexGrow; isLayoutAffecting = true; }
    if (style.flexShrink.has_value()) { layoutStyle.flexShrink = style.flexShrink; isLayoutAffecting = true; }
    if (style.flexBasis.has_value()) { layoutStyle.flexBasis = style.flexBasis; isLayoutAffecting = true; }
    if (style.top.has_value()) { layoutStyle.top = style.top; isLayoutAffecting = true; }
    if (style.bottom.has_value()) { layoutStyle.bottom = style.bottom; isLayoutAffecting = true; }
    if (style.left.has_value()) { layoutStyle.left = style.left; isLayoutAffecting = true; }
    if (style.right.has_value()) { layoutStyle.right = style.right; isLayoutAffecting = true; }

    if (isLayoutAffecting) {
      _layoutSubsystem.updateLayoutNode(id, layoutStyle);
      _layoutSubsystem.markDirty(id); // Ép Yoga tính toán lại
    }
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
