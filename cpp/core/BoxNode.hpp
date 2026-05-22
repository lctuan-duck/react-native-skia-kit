#pragma once

#include "RenderNode.hpp"
#include <mutex>
#include <algorithm>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include <include/core/SkCanvas.h>
#include <include/core/SkPaint.h>
#include <include/core/SkRRect.h>
#include <include/core/SkPath.h>
#include <include/core/SkMaskFilter.h>
#include <include/core/SkBlurTypes.h>
#pragma clang diagnostic pop

namespace margelo::nitro::skiakit {

struct BoxProps {
  uint32_t backgroundColor = 0x00000000;  // SkColor ARGB — transparent mặc định
  float    borderRadius     = 0.f;
  float    borderWidth      = 0.f;
  uint32_t borderColor      = 0xFF000000;  // SkColor ARGB — đen mặc định
  float    elevation        = 0.f;         // Android elevation → shadow
  bool     overflowHidden   = false;
};

/**
 * BoxNode — Container drawable.
 *
 * Thứ tự vẽ đúng: Shadow → Clip → Background → Border
 *   - Shadow vẽ trước clip để không bị cắt
 *   - Clip xảy ra trước background để border inset đúng cách
 *   - Border dùng SkPaint::kStroke_Style, stroke inset bằng makeInset(borderWidth/2)
 */
class BoxNode : public RenderNode {
public:
  explicit BoxNode(const std::string& id) : RenderNode(id, "Box") {}

  void updateProps(const BoxProps& props) {
    std::lock_guard<std::mutex> lock(_propMutex);
    _props = props;
  }

  void draw(SkCanvas* canvas) override {
    BoxProps props;
    float w, h;
    {
      std::lock_guard<std::mutex> lock(_propMutex);
      props = _props;
    }
    {
      std::shared_lock<std::shared_mutex> lock(_childrenMutex);
      w = _cachedW;
      h = _cachedH;
    }

    if (w <= 0.f || h <= 0.f) {
      // __android_log_print(ANDROID_LOG_DEBUG, "SkiaKit", "BoxNode::draw id=%s SKIPPED w=%.1f h=%.1f", id.c_str(), w, h);
      return;
    }

    // __android_log_print(ANDROID_LOG_DEBUG, "SkiaKit", "BoxNode::draw id=%s w=%.1f h=%.1f bg=0x%08x alpha=%d", id.c_str(), w, h, props.backgroundColor, (props.backgroundColor >> 24));

    const SkRect bounds = SkRect::MakeWH(w, h);
    const float  r      = props.borderRadius;

    // ── 1. Shadow (elevation) ──────────────────────────────────────────────
    if (props.elevation > 0.f) {
      SkPaint shadowPaint;
      shadowPaint.setAntiAlias(true);
      shadowPaint.setColor(0x40000000);  // semi-transparent black
      // Blur radius tương đương elevation * 2
      float blur = props.elevation * 2.f;
      shadowPaint.setMaskFilter(
        SkMaskFilter::MakeBlur(kNormal_SkBlurStyle, blur)
      );
      SkRect shadowBounds = bounds.makeOffset(0, props.elevation * 0.5f);
      if (r > 0.f) {
        canvas->drawRoundRect(shadowBounds, r, r, shadowPaint);
      } else {
        canvas->drawRect(shadowBounds, shadowPaint);
      }
    }

    // ── 2. Clip (chỉ khi có overflow: hidden) ───────────────
    if (props.overflowHidden) {
      SkPath clipPath;
      if (r > 0.f) {
        clipPath.addRoundRect(bounds, r, r);
      } else {
        clipPath.addRect(bounds);
      }
      canvas->clipPath(clipPath, true /* antiAlias */);
    }

    // ── 3. Background ─────────────────────────────────────────────────────
    if ((props.backgroundColor >> 24) != 0) {  // alpha != 0
      SkPaint bgPaint;
      bgPaint.setAntiAlias(true);
      bgPaint.setColor(props.backgroundColor);
      bgPaint.setStyle(SkPaint::kFill_Style);
      if (r > 0.f) {
        canvas->drawRoundRect(bounds, r, r, bgPaint);
      } else {
        canvas->drawRect(bounds, bgPaint);
      }
    }

    // ── 4. Border ─────────────────────────────────────────────────────────
    if (props.borderWidth > 0.f && (props.borderColor >> 24) != 0) {
      SkPaint borderPaint;
      borderPaint.setAntiAlias(true);
      borderPaint.setColor(props.borderColor);
      borderPaint.setStyle(SkPaint::kStroke_Style);
      borderPaint.setStrokeWidth(props.borderWidth);

      // Inset bounds bằng borderWidth/2 để stroke hoàn toàn nằm trong node
      const float inset = props.borderWidth * 0.5f;
      const SkRect borderBounds = bounds.makeInset(inset, inset);
      if (r > 0.f) {
        float innerR = std::max(0.f, r - inset);
        canvas->drawRoundRect(borderBounds, innerR, innerR, borderPaint);
      } else {
        canvas->drawRect(borderBounds, borderPaint);
      }
    }
  }

protected:
  BoxProps _props;
  std::mutex _propMutex;  // props được update từ JS thread, đọc từ Render thread
};

} // namespace margelo::nitro::skiakit
