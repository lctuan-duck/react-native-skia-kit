#pragma once

#include "RenderNode.hpp"
#include <mutex>
#include <algorithm>
#include <array>
#include <android/log.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include <include/core/SkCanvas.h>
#include <include/core/SkPaint.h>
#include <include/core/SkRRect.h>
#include <include/core/SkPath.h>
#include <include/core/SkMaskFilter.h>
#include <include/core/SkBlurTypes.h>
#include <include/effects/SkDashPathEffect.h>
// Phase 3: Shaders, Gradients & Filters
#include <include/effects/SkGradientShader.h>
#include <include/effects/SkImageFilters.h>
#include <include/core/SkColorFilter.h>
#include <include/core/SkBlendMode.h>
#pragma clang diagnostic pop

namespace margelo::nitro::skiakit {

// ─── Phase 3: Gradient Data ───────────────────────────────────────────────

/** Supported gradient types */
enum class GradientType { None, Linear, Radial, Sweep };

/** Gradient data stored in BoxProps — coordinates already normalized (0–1) */
struct GradientData {
  GradientType type = GradientType::None;
  std::vector<SkColor> colors;     // Already converted to SkColor (ARGB)
  std::vector<SkScalar> positions; // Stop positions 0.0–1.0 (empty = evenly distributed)
  // Linear
  float startX = 0.f, startY = 0.5f;
  float endX   = 1.f, endY   = 0.5f;
  // Radial
  float centerX = 0.5f, centerY = 0.5f;
  float radius  = 0.5f;
  // Sweep
  float startAngle = 0.f, endAngle = 360.f;
  // Shared
  SkTileMode tileMode = SkTileMode::kClamp;
};

/** Helper: parse tileMode string → SkTileMode */
inline SkTileMode parseTileMode(const std::string& s) {
  if (s == "repeat") return SkTileMode::kRepeat;
  if (s == "mirror") return SkTileMode::kMirror;
  return SkTileMode::kClamp;
}

/** Helper: parse blendMode string → SkBlendMode */
inline SkBlendMode parseBlendMode(const std::string& s) {
  if (s == "multiply")   return SkBlendMode::kMultiply;
  if (s == "screen")     return SkBlendMode::kScreen;
  if (s == "overlay")    return SkBlendMode::kOverlay;
  if (s == "darken")     return SkBlendMode::kDarken;
  if (s == "lighten")    return SkBlendMode::kLighten;
  if (s == "colorDodge") return SkBlendMode::kColorDodge;
  if (s == "colorBurn")  return SkBlendMode::kColorBurn;
  if (s == "hardLight")  return SkBlendMode::kHardLight;
  if (s == "softLight")  return SkBlendMode::kSoftLight;
  if (s == "difference") return SkBlendMode::kDifference;
  if (s == "exclusion")  return SkBlendMode::kExclusion;
  if (s == "hue")        return SkBlendMode::kHue;
  if (s == "saturation") return SkBlendMode::kSaturation;
  if (s == "color")      return SkBlendMode::kColor;
  if (s == "luminosity") return SkBlendMode::kLuminosity;
  return SkBlendMode::kSrcOver; // default
}

struct BoxProps {
  uint32_t backgroundColor = 0x00000000;

  float borderRadius = 0.f;
  float borderTopLeftRadius = -1.f;
  float borderTopRightRadius = -1.f;
  float borderBottomRightRadius = -1.f;
  float borderBottomLeftRadius = -1.f;

  float borderWidth = 0.f;
  float borderTopWidth = -1.f;
  float borderRightWidth = -1.f;
  float borderBottomWidth = -1.f;
  float borderLeftWidth = -1.f;

  uint32_t borderColor = 0x00000000;
  uint32_t borderTopColor = 0;
  uint32_t borderRightColor = 0;
  uint32_t borderBottomColor = 0;
  uint32_t borderLeftColor = 0;

  std::string borderStyle = "solid";
  float dashLength = -1.f;
  float dashSpacing = -1.f;

  float elevation = 0.f;

  uint32_t shadowColor = 0x00000000;
  float shadowOffsetX = 0.f;
  float shadowOffsetY = 0.f;
  float shadowBlur = 0.f;
  float shadowOpacity = 1.0f;
  float shadowSpread = 0.f;
  std::string shadowType = "outer";

  bool overflowHidden = false;

  // Phase 3: Shaders & Filters
  GradientData gradient;                         // type==None → skip gradient
  float backdropBlurRadius = 0.f;                // 0 = disabled
  SkBlendMode blendMode = SkBlendMode::kSrcOver;
  std::vector<float> colorFilter;                // 20-element 4x5 matrix (empty = disabled)
};


struct AnimatedBoxProps {
  std::optional<uint32_t> backgroundColor;

  std::optional<float> borderRadius;
  std::optional<float> borderTopLeftRadius;
  std::optional<float> borderTopRightRadius;
  std::optional<float> borderBottomRightRadius;
  std::optional<float> borderBottomLeftRadius;

  std::optional<float> borderWidth;
  std::optional<float> borderTopWidth;
  std::optional<float> borderRightWidth;
  std::optional<float> borderBottomWidth;
  std::optional<float> borderLeftWidth;

  std::optional<uint32_t> borderColor;
  std::optional<uint32_t> borderTopColor;
  std::optional<uint32_t> borderRightColor;
  std::optional<uint32_t> borderBottomColor;
  std::optional<uint32_t> borderLeftColor;

  std::optional<std::string> borderStyle;
  std::optional<float> dashLength;
  std::optional<float> dashSpacing;

  std::optional<uint32_t> shadowColor;
  std::optional<float> shadowOffsetX;
  std::optional<float> shadowOffsetY;
  std::optional<float> shadowBlur;
  std::optional<float> shadowOpacity;
  std::optional<float> shadowSpread;
  std::optional<std::string> shadowType;

  // Phase 3: Shaders & Filters
  std::optional<GradientData> gradient;
  std::optional<float> backdropBlurRadius;
  std::optional<std::string> blendMode;
  std::optional<std::vector<float>> colorFilter;
};


/**
 * BoxNode — Container drawable with Advanced Visuals (Phase 2).
 * Hỗ trợ: BorderRadius (từng góc), Border (từng cạnh, style), Shadow, Overflow.
 */
class BoxNode : public RenderNode {
public:
  explicit BoxNode(const std::string& id)
    : RenderNode(id, "Box") {
    // Đăng ký cho Yoga
    YGNodeSetContext(yogaNode, this);
  }

  void updateProps(const BoxProps& props) {
    std::lock_guard<std::mutex> lock(_propMutex);
    _props = props;
  }

  void updateAnimatedStyles(const NativeAnimatedStyle& style) override {
    RenderNode::updateAnimatedStyles(style);
    
    std::lock_guard<std::mutex> lock(_propMutex);

    // Prevent RenderNode from drawing a square background, 
    // we handle animated background color here with border radius!
    if (style.backgroundColor.has_value()) {
      _animatedProps.backgroundColor = static_cast<uint32_t>(style.backgroundColor.value());
      _backgroundColor.store(0, std::memory_order_relaxed);
    }
    
    // Radii
    if (style.borderRadius.has_value()) _animatedProps.borderRadius = static_cast<float>(style.borderRadius.value());
    if (style.borderTopLeftRadius.has_value()) _animatedProps.borderTopLeftRadius = static_cast<float>(style.borderTopLeftRadius.value());
    if (style.borderTopRightRadius.has_value()) _animatedProps.borderTopRightRadius = static_cast<float>(style.borderTopRightRadius.value());
    if (style.borderBottomRightRadius.has_value()) _animatedProps.borderBottomRightRadius = static_cast<float>(style.borderBottomRightRadius.value());
    if (style.borderBottomLeftRadius.has_value()) _animatedProps.borderBottomLeftRadius = static_cast<float>(style.borderBottomLeftRadius.value());
    
    // Border Widths
    if (style.borderWidth.has_value()) _animatedProps.borderWidth = static_cast<float>(style.borderWidth.value());
    if (style.borderTopWidth.has_value()) _animatedProps.borderTopWidth = static_cast<float>(style.borderTopWidth.value());
    if (style.borderRightWidth.has_value()) _animatedProps.borderRightWidth = static_cast<float>(style.borderRightWidth.value());
    if (style.borderBottomWidth.has_value()) _animatedProps.borderBottomWidth = static_cast<float>(style.borderBottomWidth.value());
    if (style.borderLeftWidth.has_value()) _animatedProps.borderLeftWidth = static_cast<float>(style.borderLeftWidth.value());
    
    // Border Colors
    if (style.borderColor.has_value()) _animatedProps.borderColor = static_cast<uint32_t>(style.borderColor.value());
    if (style.borderTopColor.has_value()) _animatedProps.borderTopColor = static_cast<uint32_t>(style.borderTopColor.value());
    if (style.borderRightColor.has_value()) _animatedProps.borderRightColor = static_cast<uint32_t>(style.borderRightColor.value());
    if (style.borderBottomColor.has_value()) _animatedProps.borderBottomColor = static_cast<uint32_t>(style.borderBottomColor.value());
    if (style.borderLeftColor.has_value()) _animatedProps.borderLeftColor = static_cast<uint32_t>(style.borderLeftColor.value());
    
    // Border Style
    if (style.borderStyle.has_value()) _animatedProps.borderStyle = style.borderStyle.value();
    if (style.dashLength.has_value()) _animatedProps.dashLength = static_cast<float>(style.dashLength.value());
    if (style.dashSpacing.has_value()) _animatedProps.dashSpacing = static_cast<float>(style.dashSpacing.value());
    
    // Shadows
    if (style.shadowColor.has_value()) _animatedProps.shadowColor = static_cast<uint32_t>(style.shadowColor.value());
    if (style.shadowOffsetX.has_value()) _animatedProps.shadowOffsetX = static_cast<float>(style.shadowOffsetX.value());
    if (style.shadowOffsetY.has_value()) _animatedProps.shadowOffsetY = static_cast<float>(style.shadowOffsetY.value());
    if (style.shadowBlur.has_value()) _animatedProps.shadowBlur = static_cast<float>(style.shadowBlur.value());
    if (style.shadowOpacity.has_value()) _animatedProps.shadowOpacity = static_cast<float>(style.shadowOpacity.value());
    if (style.shadowSpread.has_value()) _animatedProps.shadowSpread = static_cast<float>(style.shadowSpread.value());
    if (style.shadowType.has_value()) _animatedProps.shadowType = style.shadowType.value();

    // Phase 3: Gradient
    if (style.gradient.has_value()) {
      const auto& g = style.gradient.value();
      GradientData gd;
      if (g.type == "linear")      gd.type = GradientType::Linear;
      else if (g.type == "radial") gd.type = GradientType::Radial;
      else if (g.type == "sweep")  gd.type = GradientType::Sweep;
      gd.colors = std::vector<SkColor>(g.colors.begin(), g.colors.end());
      if (g.positions.has_value()) {
        gd.positions = std::vector<SkScalar>(g.positions.value().begin(), g.positions.value().end());
      }
      gd.startX  = g.startX.value_or(0.f);
      gd.startY  = g.startY.value_or(0.5f);
      gd.endX    = g.endX.value_or(1.f);
      gd.endY    = g.endY.value_or(0.5f);
      gd.centerX = g.centerX.value_or(0.5f);
      gd.centerY = g.centerY.value_or(0.5f);
      gd.radius  = g.radius.value_or(0.5f);
      gd.startAngle = g.startAngle.value_or(0.f);
      gd.endAngle   = g.endAngle.value_or(360.f);
      if (g.tileMode.has_value()) gd.tileMode = parseTileMode(g.tileMode.value());
      _animatedProps.gradient = gd;
    }

    // Phase 3: Backdrop blur
    if (style.backdropBlurRadius.has_value())
      _animatedProps.backdropBlurRadius = static_cast<float>(style.backdropBlurRadius.value());

    // Phase 3: Blend mode
    if (style.blendMode.has_value())
      _animatedProps.blendMode = style.blendMode.value();

    // Phase 3: Color filter matrix
    if (style.colorFilter.has_value())
      _animatedProps.colorFilter = std::vector<float>(style.colorFilter.value().begin(), style.colorFilter.value().end());
  }


  void draw(SkCanvas* canvas) override {
    BoxProps props;
    AnimatedBoxProps animatedProps;
    float w, h;
    {
      std::lock_guard<std::mutex> lock(_propMutex);
      props = _props;
      animatedProps = _animatedProps;
    }
    {
      std::shared_lock<std::shared_mutex> lock(_childrenMutex);
      w = getWidth();
      h = getHeight();
    }

    if (w <= 0.f || h <= 0.f) {
      return;
    }

    // Merge Animated Props into Base Props
    if (animatedProps.backgroundColor.has_value()) props.backgroundColor = animatedProps.backgroundColor.value();

    if (animatedProps.borderRadius.has_value()) props.borderRadius = animatedProps.borderRadius.value();
    if (animatedProps.borderTopLeftRadius.has_value()) props.borderTopLeftRadius = animatedProps.borderTopLeftRadius.value();
    if (animatedProps.borderTopRightRadius.has_value()) props.borderTopRightRadius = animatedProps.borderTopRightRadius.value();
    if (animatedProps.borderBottomRightRadius.has_value()) props.borderBottomRightRadius = animatedProps.borderBottomRightRadius.value();
    if (animatedProps.borderBottomLeftRadius.has_value()) props.borderBottomLeftRadius = animatedProps.borderBottomLeftRadius.value();

    if (animatedProps.borderWidth.has_value()) props.borderWidth = animatedProps.borderWidth.value();
    if (animatedProps.borderTopWidth.has_value()) props.borderTopWidth = animatedProps.borderTopWidth.value();
    if (animatedProps.borderRightWidth.has_value()) props.borderRightWidth = animatedProps.borderRightWidth.value();
    if (animatedProps.borderBottomWidth.has_value()) props.borderBottomWidth = animatedProps.borderBottomWidth.value();
    if (animatedProps.borderLeftWidth.has_value()) props.borderLeftWidth = animatedProps.borderLeftWidth.value();

    if (animatedProps.borderColor.has_value()) props.borderColor = animatedProps.borderColor.value();
    if (animatedProps.borderTopColor.has_value()) props.borderTopColor = animatedProps.borderTopColor.value();
    if (animatedProps.borderRightColor.has_value()) props.borderRightColor = animatedProps.borderRightColor.value();
    if (animatedProps.borderBottomColor.has_value()) props.borderBottomColor = animatedProps.borderBottomColor.value();
    if (animatedProps.borderLeftColor.has_value()) props.borderLeftColor = animatedProps.borderLeftColor.value();

    if (animatedProps.borderStyle.has_value()) props.borderStyle = animatedProps.borderStyle.value();
    if (animatedProps.dashLength.has_value()) props.dashLength = animatedProps.dashLength.value();
    if (animatedProps.dashSpacing.has_value()) props.dashSpacing = animatedProps.dashSpacing.value();

    if (animatedProps.shadowColor.has_value()) props.shadowColor = animatedProps.shadowColor.value();
    if (animatedProps.shadowOffsetX.has_value()) props.shadowOffsetX = animatedProps.shadowOffsetX.value();
    if (animatedProps.shadowOffsetY.has_value()) props.shadowOffsetY = animatedProps.shadowOffsetY.value();
    if (animatedProps.shadowBlur.has_value()) props.shadowBlur = animatedProps.shadowBlur.value();
    if (animatedProps.shadowOpacity.has_value()) props.shadowOpacity = animatedProps.shadowOpacity.value();
    if (animatedProps.shadowSpread.has_value()) props.shadowSpread = animatedProps.shadowSpread.value();
    if (animatedProps.shadowType.has_value()) props.shadowType = animatedProps.shadowType.value();

    // Phase 3: merge animated shader props
    if (animatedProps.gradient.has_value())          props.gradient = animatedProps.gradient.value();
    if (animatedProps.backdropBlurRadius.has_value()) props.backdropBlurRadius = animatedProps.backdropBlurRadius.value();
    if (animatedProps.blendMode.has_value())          props.blendMode = parseBlendMode(animatedProps.blendMode.value());
    if (animatedProps.colorFilter.has_value())        props.colorFilter = animatedProps.colorFilter.value();

    const SkRect bounds = SkRect::MakeWH(w, h);

    // 1. Resolve Radii
    SkVector radii[4];
    float tl = props.borderTopLeftRadius >= 0 ? props.borderTopLeftRadius : props.borderRadius;
    float tr = props.borderTopRightRadius >= 0 ? props.borderTopRightRadius : props.borderRadius;
    float br = props.borderBottomRightRadius >= 0 ? props.borderBottomRightRadius : props.borderRadius;
    float bl = props.borderBottomLeftRadius >= 0 ? props.borderBottomLeftRadius : props.borderRadius;
    radii[0] = {tl, tl};
    radii[1] = {tr, tr};
    radii[2] = {br, br};
    radii[3] = {bl, bl};
    
    SkRRect rrect;
    rrect.setRectRadii(bounds, radii);

    // 2. Outer Shadow
    float blur = props.shadowBlur > 0 ? props.shadowBlur : (props.elevation > 0 ? props.elevation * 2.f : 0.f);
    uint32_t sColor = props.shadowColor != 0 ? props.shadowColor : (props.elevation > 0 ? 0x40000000 : 0);
    
    if (blur > 0.f || (sColor >> 24) != 0) {
      uint8_t shadowAlpha = (uint8_t)(((sColor >> 24) & 0xFF) * props.shadowOpacity);
      uint32_t finalShadowColor = (sColor & 0x00FFFFFF) | (shadowAlpha << 24);

      if (shadowAlpha > 0) {
        bool isInner = props.shadowType == "inner";
        SkPaint shadowPaint;
        shadowPaint.setAntiAlias(true);
        shadowPaint.setColor(finalShadowColor);
        
        if (blur > 0.f) {
          shadowPaint.setMaskFilter(SkMaskFilter::MakeBlur(kNormal_SkBlurStyle, blur));
        }

        float dx = props.shadowOffsetX;
        float dy = props.shadowOffsetY + (props.elevation > 0 && props.shadowOffsetY == 0 ? props.elevation * 0.5f : 0);
        float spread = props.shadowSpread;

        if (!isInner) {
          SkRect shadowBounds = bounds.makeOutset(spread, spread).makeOffset(dx, dy);
          SkRRect shadowRRect;
          SkVector spreadRadii[4] = {
            {std::max(0.f, tl + spread), std::max(0.f, tl + spread)},
            {std::max(0.f, tr + spread), std::max(0.f, tr + spread)},
            {std::max(0.f, br + spread), std::max(0.f, br + spread)},
            {std::max(0.f, bl + spread), std::max(0.f, bl + spread)}
          };
          shadowRRect.setRectRadii(shadowBounds, spreadRadii);

          canvas->save();
          if ((props.backgroundColor >> 24) < 255 || tl > 0 || tr > 0 || br > 0 || bl > 0) {
            canvas->clipRRect(rrect, SkClipOp::kDifference, true);
          }
          canvas->drawRRect(shadowRRect, shadowPaint);
          canvas->restore();
        } else {
          // Inner shadow
          canvas->save();
          canvas->clipRRect(rrect, SkClipOp::kIntersect, true);
          float extraInflate = blur * 2.f + std::abs(spread) * 2.f + 10.f;
          shadowPaint.setStyle(SkPaint::kStroke_Style);
          shadowPaint.setStrokeWidth(extraInflate * 2.f);
          canvas->translate(dx, dy);
          SkRect drawBounds = bounds.makeInset(spread, spread);
          SkRRect drawRRect;
          drawRRect.setRectRadii(drawBounds, radii);
          canvas->drawRRect(drawRRect, shadowPaint);
          canvas->restore();
        }
      }
    }

    // 3. Clip (overflow hidden)
    if (props.overflowHidden) {
      canvas->clipRRect(rrect, true);
    }

    // ── Phase 3: Backdrop Blur ────────────────────────────────────────────
    // Effect: content behind the Box is blurred → frosted glass / glassmorphism.
    // We clip to `rrect` so the blur doesn't spill outside the rounded box.
    bool hasBackdropBlur = props.backdropBlurRadius > 0.f;
    if (hasBackdropBlur) {
      canvas->save();
      canvas->clipRRect(rrect, true);
      sk_sp<SkImageFilter> backdropFilter = SkImageFilters::Blur(props.backdropBlurRadius, props.backdropBlurRadius, nullptr);
      canvas->saveLayer(SkCanvas::SaveLayerRec(&bounds, nullptr, backdropFilter.get(), 0));
      canvas->restore(); // immediately restore the saveLayer, which composites the blurred backdrop!
      canvas->restore(); // restore the clip
    }

    // ── Phase 3: Color Filter Layer ───────────────────────────────────────
    // Wraps background + children in a saveLayer with a ColorFilter applied.
    bool hasColorFilter = (props.colorFilter.size() == 20);
    if (hasColorFilter) {
      SkPaint cfPaint;
      cfPaint.setColorFilter(
        SkColorFilters::Matrix(props.colorFilter.data())
      );
      cfPaint.setBlendMode(props.blendMode);
      canvas->saveLayer(&bounds, &cfPaint);
    } else if (props.blendMode != SkBlendMode::kSrcOver) {
      // BlendMode without ColorFilter
      SkPaint blendPaint;
      blendPaint.setBlendMode(props.blendMode);
      canvas->saveLayer(&bounds, &blendPaint);
    }

    // 4. Background: Gradient or Solid Color
    if (props.gradient.type != GradientType::None && !props.gradient.colors.empty()) {
      // ── Gradient Background ──────────────────────────────────────────────
      const GradientData& g = props.gradient;
      const SkScalar* pos = g.positions.empty() ? nullptr : g.positions.data();
      const int colorCount = static_cast<int>(g.colors.size());
      sk_sp<SkShader> shader;

      if (g.type == GradientType::Linear) {
        SkPoint pts[2] = {
          {g.startX * w, g.startY * h},
          {g.endX   * w, g.endY   * h},
        };
        shader = SkGradientShader::MakeLinear(pts, g.colors.data(), pos, colorCount, g.tileMode);
      } else if (g.type == GradientType::Radial) {
        SkPoint center = {g.centerX * w, g.centerY * h};
        shader = SkGradientShader::MakeRadial(center, g.radius * w, g.colors.data(), pos, colorCount, g.tileMode);
      } else if (g.type == GradientType::Sweep) {
        SkPoint center = {g.centerX * w, g.centerY * h};
        shader = SkGradientShader::MakeSweep(center.x(), center.y(), g.colors.data(), pos, colorCount,
                                              g.tileMode, g.startAngle, g.endAngle, 0, nullptr);
      }

      if (shader) {
        SkPaint gradPaint;
        gradPaint.setAntiAlias(true);
        gradPaint.setShader(shader);
        canvas->drawRRect(rrect, gradPaint);
      }
    } else if ((props.backgroundColor >> 24) != 0) {
      // ── Solid Color Background ───────────────────────────────────────────
      SkPaint bgPaint;
      bgPaint.setAntiAlias(true);
      bgPaint.setColor(props.backgroundColor);
      bgPaint.setStyle(SkPaint::kFill_Style);
      canvas->drawRRect(rrect, bgPaint);
    }

    // 5. Border
    float tw = props.borderTopWidth >= 0 ? props.borderTopWidth : props.borderWidth;
    float rw = props.borderRightWidth >= 0 ? props.borderRightWidth : props.borderWidth;
    float bw = props.borderBottomWidth >= 0 ? props.borderBottomWidth : props.borderWidth;
    float lw = props.borderLeftWidth >= 0 ? props.borderLeftWidth : props.borderWidth;
    
    uint32_t tc = props.borderTopColor != 0 ? props.borderTopColor : props.borderColor;
    uint32_t rc = props.borderRightColor != 0 ? props.borderRightColor : props.borderColor;
    uint32_t bc = props.borderBottomColor != 0 ? props.borderBottomColor : props.borderColor;
    uint32_t lc = props.borderLeftColor != 0 ? props.borderLeftColor : props.borderColor;

    bool isUniformWidth = (tw == rw && rw == bw && bw == lw);
    bool isUniformColor = (tc == rc && rc == bc && bc == lc);

    if (isUniformWidth && isUniformColor && tw > 0.f && (tc >> 24) != 0) {
      // Fast path: Uniform stroke
      SkPaint borderPaint;
      borderPaint.setAntiAlias(true);
      borderPaint.setColor(tc);
      borderPaint.setStyle(SkPaint::kStroke_Style);
      borderPaint.setStrokeWidth(tw);

      if (props.borderStyle == "dashed" || props.borderStyle == "dotted") {
        float dLen = props.dashLength > 0 ? props.dashLength : (props.borderStyle == "dotted" ? tw : tw * 3.f);
        float dSpc = props.dashSpacing > 0 ? props.dashSpacing : (props.borderStyle == "dotted" ? tw * 1.5f : tw * 3.f);
        SkScalar intervals[] = { dLen, dSpc };
        borderPaint.setPathEffect(SkDashPathEffect::Make(intervals, 0.0f));
      }

      float inset = tw * 0.5f;
      SkRect borderBounds = bounds.makeInset(inset, inset);
      SkVector innerRadii[4] = {
        {std::max(0.f, tl - inset), std::max(0.f, tl - inset)},
        {std::max(0.f, tr - inset), std::max(0.f, tr - inset)},
        {std::max(0.f, br - inset), std::max(0.f, br - inset)},
        {std::max(0.f, bl - inset), std::max(0.f, bl - inset)}
      };
      SkRRect borderRRect;
      borderRRect.setRectRadii(borderBounds, innerRadii);
      canvas->drawRRect(borderRRect, borderPaint);
    } else {
      // Complex path: Individual edges (Mitered joints via Triangle Clipping)
      SkPoint center = {w / 2.f, h / 2.f};
      
      auto drawEdgeWithClip = [&](uint32_t color, float edgeWidth, SkPoint p1, SkPoint p2) {
        if (edgeWidth > 0 && (color >> 24) != 0) {
          SkPath clipTriangle;
          clipTriangle.moveTo(p1);
          clipTriangle.lineTo(p2);
          clipTriangle.lineTo(center);
          clipTriangle.close();

          canvas->save();
          canvas->clipPath(clipTriangle, true);
          
          SkPaint edgePaint;
          edgePaint.setAntiAlias(true);
          edgePaint.setColor(color);
          edgePaint.setStyle(SkPaint::kStroke_Style);
          edgePaint.setStrokeWidth(edgeWidth);

          if (props.borderStyle == "dashed" || props.borderStyle == "dotted") {
            float dLen = props.dashLength > 0 ? props.dashLength : (props.borderStyle == "dotted" ? edgeWidth : edgeWidth * 3.f);
            float dSpc = props.dashSpacing > 0 ? props.dashSpacing : (props.borderStyle == "dotted" ? edgeWidth * 1.5f : edgeWidth * 3.f);
            SkScalar intervals[] = { dLen, dSpc };
            edgePaint.setPathEffect(SkDashPathEffect::Make(intervals, 0.0f));
          }

          float inset = edgeWidth * 0.5f;
          SkRect borderBounds = bounds.makeInset(inset, inset);
          SkVector innerRadii[4] = {
            {std::max(0.f, tl - inset), std::max(0.f, tl - inset)},
            {std::max(0.f, tr - inset), std::max(0.f, tr - inset)},
            {std::max(0.f, br - inset), std::max(0.f, br - inset)},
            {std::max(0.f, bl - inset), std::max(0.f, bl - inset)}
          };
          SkRRect borderRRect;
          borderRRect.setRectRadii(borderBounds, innerRadii);
          
          canvas->drawRRect(borderRRect, edgePaint);
          canvas->restore();
        }
      };

      drawEdgeWithClip(tc, tw, {0, 0}, {w, 0});       // Top
      drawEdgeWithClip(rc, rw, {w, 0}, {w, h});       // Right
      drawEdgeWithClip(bc, bw, {w, h}, {0, h});       // Bottom
      drawEdgeWithClip(lc, lw, {0, h}, {0, 0});       // Left
    }

    if (hasColorFilter || props.blendMode != SkBlendMode::kSrcOver) {
      canvas->restore(); // restore color filter / blend mode layer
    }
  }

protected:
  BoxProps _props;
  AnimatedBoxProps _animatedProps;
  std::mutex _propMutex; 
};

} // namespace margelo::nitro::skiakit
