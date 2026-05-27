#pragma once

#include "RenderNode.hpp"
#include <include/core/SkColor.h>
#include <include/core/SkPath.h>
#include <include/core/SkPaint.h>
#include <string>

// Shopify Skia bundle includes SkParsePath
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include "include/utils/SkParsePath.h"
#pragma clang diagnostic pop

namespace margelo::nitro::skiakit {

class IconNode : public RenderNode {
public:
  SkPath _path;
  SkColor _color = SK_ColorBLACK;
  bool _isStroke = false;
  float _strokeWidth = 2.0f;

  IconNode(const std::string& id) : RenderNode(id, "Icon") {}

  void updateIcon(const std::string& pathString, SkColor color, bool isStroke, float strokeWidth) {
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    _color = color;
    _isStroke = isStroke;
    _strokeWidth = strokeWidth;
    SkParsePath::FromSVGString(pathString.c_str(), &_path);
  }

  void draw(SkCanvas* canvas) override {
    float w = getWidth();
    float h = getHeight();
    if (w <= 0 || h <= 0) return;

    SkPaint paint;
    paint.setAntiAlias(true);
    paint.setColor(_color);

    if (_isStroke) {
      paint.setStyle(SkPaint::kStroke_Style);
      paint.setStrokeWidth(_strokeWidth);
      paint.setStrokeCap(SkPaint::kRound_Cap);
      paint.setStrokeJoin(SkPaint::kRound_Join);
    } else {
      paint.setStyle(SkPaint::kFill_Style);
    }

    // Default icon viewBox is 24x24 in iconMap
    float scaleX = w / 24.0f;
    float scaleY = h / 24.0f;
    
    canvas->save();
    canvas->scale(scaleX, scaleY);
    canvas->drawPath(_path, paint);
    canvas->restore();
  }
};

} // namespace margelo::nitro::skiakit
