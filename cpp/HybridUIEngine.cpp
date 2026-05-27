#include "HybridUIEngine.hpp"
#ifdef __ANDROID__
#include <android/log.h>
#endif
#include <stdexcept>

// Shopify Skia JSI canvas unwrapping
#include "api/JsiSkCanvas.h"

// RNSkPlatformContext — cần để loadAsync image và runOnMainThread
#include "RNSkPlatformContext.h"

namespace margelo::nitro::skiakit {

// Static member definitions
std::shared_ptr<RNSkia::RNSkPlatformContext> HybridUIEngine::_pendingPlatformContext;

// Engine registry — multi-instance support
std::atomic<int64_t>                                        HybridUIEngine::_sNextId{0};
std::unordered_map<int64_t, std::weak_ptr<HybridUIEngine>> HybridUIEngine::_sRegistry;
std::mutex                                                  HybridUIEngine::_sRegistryMutex;

  // ── Platform init ──────────────────────────────────────────────────────────

  void HybridUIEngine::initWithPlatformContext(
    std::shared_ptr<RNSkia::RNSkPlatformContext> ctx)
  {
    _platformContext = ctx;
    _renderSubsystem.initFontManager(ctx->createFontMgr());

    // Khởi tạo C++ Autonomous Renderer
    _renderer = std::make_shared<SkiaKitRenderer>(
      ctx, _renderSubsystem, _layoutSubsystem, _hitTestSubsystem
    );

    // Wire dirty callback: mỗi khi node thiết lập onRequestRedraw
    // (image load, layout transition...) → C++ tự schedule render
    _renderSubsystem.setRedrawCallback([weakRenderer = std::weak_ptr<SkiaKitRenderer>(_renderer)]() {
      if (auto renderer = weakRenderer.lock()) {
        renderer->scheduleRender();
      }
    });

    // Wire layout update callback — C++ push layout results đến JS
    // sau mỗi calculateLayout cycle, JS gọi getAllLayouts() + updateLayoutSVs()
    // dynamic_pointer_cast cần thiết vì shared_from_this() trả về shared_ptr<HybridObject>
    auto sharedSelf = std::dynamic_pointer_cast<HybridUIEngine>(shared_from_this());
    std::weak_ptr<HybridUIEngine> weakSelf = sharedSelf;
    _renderer->setLayoutUpdateCallback([weakSelf]() {
      if (auto self = weakSelf.lock()) {
        if (self->_onLayoutCompleteJS) {
          self->_onLayoutCompleteJS();
        }
      }
    });
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
  void HybridUIEngine::registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) {
    _hitTestSubsystem.registerScrollArea(id, x, y, w, h, horizontal);
  }
  std::vector<NativeHitResult> HybridUIEngine::hitTest(double x, double y) {
    return _hitTestSubsystem.hitTest(x, y);
  }

  // ── Layout Subsystem ───────────────────────────────────────────────────────

  void HybridUIEngine::updateLayoutNode(const std::string& id, const NativeYogaStyle& style) {
    _layoutSubsystem.updateLayoutNode(id, style);
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
    
    // Register the measure function with Yoga
    _layoutSubsystem.enableMeasureFunc(id);
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

  void HybridUIEngine::createScrollNodeFull(const std::string& id, const NativeYogaStyle& yogaStyle, bool horizontal, double contentPadding, double zIndex) {
    // 1. Create layout node and set style (which has overflow:hidden)
    _layoutSubsystem.updateLayoutNode(id, yogaStyle);
    // 2. Create render node
    _renderSubsystem.createScrollNode(id, horizontal);
    // 3. Register scroll area
    _hitTestSubsystem.registerScrollArea(id, 0, 0, 0, 0, horizontal);
    // 4. Register widget for hit-testing (behavior = 0 (translucent))
    _hitTestSubsystem.registerWidget(id, 0, 0, 0, 0, zIndex, 0);
  }

  void HybridUIEngine::addRenderChild(const std::string& parentId, const std::string& childId) {
    try {
      _renderSubsystem.addRenderChild(parentId, childId);
    } catch (const std::exception& e) {
      __android_log_print(ANDROID_LOG_ERROR, "SkiaKit", "RenderSubsystem::addRenderChild threw exception: %s", e.what());
      throw;
    }
    try {
      _layoutSubsystem.addChild(parentId, childId);
    } catch (const std::exception& e) {
      __android_log_print(ANDROID_LOG_ERROR, "SkiaKit", "LayoutSubsystem::addChild threw exception: %s", e.what());
      throw;
    }
  }

  void HybridUIEngine::insertRenderChildBefore(const std::string& parentId, const std::string& childId, const std::string& beforeChildId) {
    try {
      _renderSubsystem.insertRenderChildBefore(parentId, childId, beforeChildId);
    } catch (const std::exception& e) {
      __android_log_print(ANDROID_LOG_ERROR, "SkiaKit", "RenderSubsystem::insertRenderChildBefore threw exception: %s", e.what());
      throw;
    }
    try {
      _layoutSubsystem.insertChildBefore(parentId, childId, beforeChildId);
    } catch (const std::exception& e) {
      __android_log_print(ANDROID_LOG_ERROR, "SkiaKit", "LayoutSubsystem::insertChildBefore threw exception: %s", e.what());
      throw;
    }
  }

  void HybridUIEngine::removeRenderChild(const std::string& parentId, const std::string& childId) {
    _renderSubsystem.removeRenderChild(parentId, childId);
    _layoutSubsystem.removeChild(parentId, childId);
  }

  void HybridUIEngine::removeRenderNode(const std::string& id) {
    _renderSubsystem.removeRenderNode(id);
    _layoutSubsystem.removeLayoutNode(id);
  }



  void HybridUIEngine::updateAnimatedStyles(const std::string& id, const NativeAnimatedStyle& style) {
    // 1. Cập nhật Render properties (Transform, Opacity, Colors, v.v...)
    // RenderSubsystem::updateAnimatedStyles dùng shared_lock — thread-safe từ UI thread.
    _renderSubsystem.updateAnimatedStyles(id, style);
    
    if (style.pointerEvents.has_value()) {
      _hitTestSubsystem.updatePointerEvents(id, style.pointerEvents.value());
    }

    // 2. Phân loại Paint vs Layout-Affecting properties
    bool isLayoutAffecting = false;
    NativeYogaStyle layoutStyle;

    if (style.width.has_value()) { layoutStyle.width = style.width; isLayoutAffecting = true; }
    if (style.height.has_value()) { layoutStyle.height = style.height; isLayoutAffecting = true; }
    if (style.marginTop.has_value()) { layoutStyle.marginTop = style.marginTop; isLayoutAffecting = true; }
    if (style.marginRight.has_value()) { layoutStyle.marginRight = style.marginRight; isLayoutAffecting = true; }
    if (style.marginBottom.has_value()) { layoutStyle.marginBottom = style.marginBottom; isLayoutAffecting = true; }
    if (style.marginLeft.has_value()) { layoutStyle.marginLeft = style.marginLeft; isLayoutAffecting = true; }
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

    if (isLayoutAffecting && _renderer) {
      // THREAD SAFETY: Yoga layout KHÔNG được gọi từ Reanimated UI thread.
      // updateLayoutNode + markDirty + scheduleLayoutAndRender phải chạy trên main thread.
      // Nếu gọi trực tiếp từ UI thread worklet → JniException (Yoga internal lock conflict).
      // Fix: wrap trong runOnMainThread để đảm bảo Yoga chỉ chạy trên main thread.
      auto self = std::dynamic_pointer_cast<HybridUIEngine>(shared_from_this());
      auto capturedId = id;
      auto capturedStyle = layoutStyle;
      _platformContext->runOnMainThread([self, capturedId, capturedStyle]() {
        if (self && self->_renderer) {
          self->_layoutSubsystem.updateLayoutNode(capturedId, capturedStyle);
          self->_layoutSubsystem.markDirty(capturedId);
          self->_renderer->scheduleLayoutAndRender();
        }
      });
      return; // scheduleLayoutAndRender được gọi bên trong runOnMainThread
    }

    // 3. Schedule render cho pure visual updates (opacity, transform, color, translateX...)
    // Đây là thread-safe: chỉ set atomic flags trong RenderNode.
    if (_renderer && _renderer->isAttached()) {
      _renderer->scheduleRender();
    }
  }

  void HybridUIEngine::setScrollPosition(const std::string& id, double offset) {
    // 1. Update ScrollNode offset in C++ Render tree (moves content visually)
    _renderSubsystem.updateScrollNodeOffset(id, (float)offset);
    // 2. Update ScrollArea offset in C++ HitTest system
    _hitTestSubsystem.updateScrollOffset(id, offset);
    // 3. Schedule render — C++ tự vẽ, không cần JS RAF loop
    if (_renderer && _renderer->isAttached()) {
      _renderer->scheduleRender();
    }
  }

  void HybridUIEngine::markDirty(const std::string& /*rootId*/) {
    _renderSubsystem.markDirty();
    // scheduleRender sẽ được gọi bởi scheduleLayoutAndRender() sau markDirty
  }

  void HybridUIEngine::scheduleLayoutAndRender() {
    if (_renderer && _renderer->isAttached()) {
      _renderer->scheduleLayoutAndRender();
    }
  }

  void HybridUIEngine::attachCanvasProvider(
    std::shared_ptr<RNSkia::RNSkCanvasProvider> provider,
    float width, float height
  ) {
    if (_renderer) {
      const std::string canvasId = "main"; // Single canvas per engine instance
      _renderer->attachCanvasProvider(std::move(provider), canvasId, width, height);
    }
  }

  void HybridUIEngine::detachNativeView() {
    if (_renderer) {
      _renderer->detachCanvasProvider();
    }
  }

  void HybridUIEngine::resize(double width, double height) {
    if (_renderer) {
      _renderer->resize((float)width, (float)height);
    }
  }

  // ── Engine Identity (Phase 3: multi-instance) ──────────────────────────

  double HybridUIEngine::getEngineId() {
    return static_cast<double>(_engineId);
  }

  void HybridUIEngine::onLayoutComplete(const std::function<void()>& callback) {
    _onLayoutCompleteJS = callback; // copy — callback lifetime extends to engine
    // Wire callback vào renderer nếu đã init (hot reload case)
    if (_renderer) {
      // dynamic_pointer_cast cần thiết vì shared_from_this() trả về shared_ptr<HybridObject>
      auto sharedSelf = std::dynamic_pointer_cast<HybridUIEngine>(shared_from_this());
      std::weak_ptr<HybridUIEngine> weakSelf = sharedSelf;
      _renderer->setLayoutUpdateCallback([weakSelf]() {
        if (auto self = weakSelf.lock()) {
          if (self->_onLayoutCompleteJS) {
            self->_onLayoutCompleteJS();
          }
        }
      });
    }
  }

} // namespace margelo::nitro::skiakit
