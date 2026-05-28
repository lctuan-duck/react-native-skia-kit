#include "RenderNode.hpp"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include <include/core/SkCanvas.h>
#include <include/core/SkM44.h>
#include <include/core/SkPaint.h>
#pragma clang diagnostic pop

#include <algorithm>
#include <cmath>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace margelo::nitro::skiakit {

void RenderNode::paint(SkCanvas* canvas) {
  float x, y, w, h;
  {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    x = getXInternal();
    y = getYInternal();
    w = getWidthInternal();
    h = getHeightInternal();
  }
  
  float opacity = _opacity.load(std::memory_order_relaxed);
  if (opacity <= 0.0f) return; // Skip render

  if (_inLayoutTransition.load(std::memory_order_relaxed)) {
    if (onRequestRedraw) {
      onRequestRedraw();
    }
  }

  // Đọc các transform
  float scaleX = _scaleX.load(std::memory_order_relaxed);
  float scaleY = _scaleY.load(std::memory_order_relaxed);
  float translateX = _translateX.load(std::memory_order_relaxed);
  float translateY = _translateY.load(std::memory_order_relaxed);
  float rotateZ = _rotateZ.load(std::memory_order_relaxed);
  float rotateX = _rotateX.load(std::memory_order_relaxed);
  float rotateY = _rotateY.load(std::memory_order_relaxed);
  float skewX = _skewX.load(std::memory_order_relaxed);
  float skewY = _skewY.load(std::memory_order_relaxed);
  float perspective = _perspective.load(std::memory_order_relaxed);
  float tOriginX = _transformOriginX.load(std::memory_order_relaxed);
  float tOriginY = _transformOriginY.load(std::memory_order_relaxed);
  
  uint32_t bgColor = _backgroundColor.load(std::memory_order_relaxed);

  canvas->save();

  // Opacity Layer
  if (opacity < 1.0f) {
    int alpha = static_cast<int>(opacity * 255.0f);
    canvas->saveLayerAlpha(nullptr, alpha);
  }

  // Toạ độ vẽ tĩnh
  canvas->translate(x, y);

  // Background Color (nếu có)
  if (bgColor != 0) {
    SkPaint paint;
    paint.setColor(bgColor);
    paint.setStyle(SkPaint::kFill_Style);
    canvas->drawRect(SkRect::MakeWH(w, h), paint);
  }

  // 2. Ma trận Transform 2D/3D
  bool hasTransform = (scaleX != 1.0f || scaleY != 1.0f || translateX != 0.0f || translateY != 0.0f ||
                       rotateZ != 0.0f || rotateX != 0.0f || rotateY != 0.0f || skewX != 0.0f || skewY != 0.0f);

  if (hasTransform) {
    float originX = (tOriginX >= 0) ? tOriginX : (w * 0.5f);
    float originY = (tOriginY >= 0) ? tOriginY : (h * 0.5f);

    // Di chuyển canvas tới tâm origin
    canvas->translate(originX + translateX, originY + translateY);

    // Xử lý Skew & 2D Transforms
    if (skewX != 0.0f || skewY != 0.0f) {
      canvas->skew(skewX, skewY);
    }
    
    // Nếu có 3D Transforms hoặc Perspective -> Dùng SkM44
    if (rotateX != 0.0f || rotateY != 0.0f || perspective != 0.0f) {
      SkM44 m44;
      if (perspective != 0.0f) {
        // Perspective projection: m[3][2] = -1/p
        SkM44 pMat;
        pMat.setRC(3, 2, -1.0f / perspective);
        m44.preConcat(pMat);
      }
      
      if (rotateX != 0.0f) {
        m44.preConcat(SkM44::Rotate({1, 0, 0}, rotateX * M_PI / 180.0f));
      }
      if (rotateY != 0.0f) {
        m44.preConcat(SkM44::Rotate({0, 1, 0}, rotateY * M_PI / 180.0f));
      }
      if (rotateZ != 0.0f) {
        m44.preConcat(SkM44::Rotate({0, 0, 1}, rotateZ * M_PI / 180.0f));
      }
      
      m44.preScale(scaleX, scaleY);
      canvas->concat(m44);
    } else {
      // Chỉ có 2D Transforms
      // FIX N1: rotateZ được lưu bằng DEGREES (từ JS: rotateZ: p * 360).
      // Skia canvas->rotate() nhận DEGREES → truyền thẳng, KHÔNG nhân 180/π.
      // (Bug cũ: nhân 180/π biến 360° thành 20628° → circular progress quay sai hoàn toàn)
      if (rotateZ != 0.0f) {
        canvas->rotate(rotateZ); // rotateZ là degrees, Skia rotate() nhận degrees ✓
      }
      canvas->scale(scaleX, scaleY);
    }

    // Trả canvas về vị trí cũ so với origin
    canvas->translate(-originX, -originY);
  }

  // 3. Vẽ nội dung node
  draw(canvas);

  // 4. Vẽ children với zIndex sorting
  {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    if (!children.empty()) {
      // FAST PATH: kiểm tra xem có child nào dùng zIndex != 0 không.
      // 90%+ trường hợp không dùng zIndex → skip copy+sort hoàn toàn.
      // Tiết kiệm O(N) allocation + O(N log N) sort trên hot path 60fps.
      bool hasCustomZIndex = false;
      for (const auto& child : children) {
        if (child->_zIndex.load(std::memory_order_relaxed) != 0) {
          hasCustomZIndex = true;
          break;
        }
      }

      if (!hasCustomZIndex) {
        // Paint theo DOM order (không copy, không sort)
        for (auto& child : children) {
          child->paint(canvas);
        }
      } else {
        // Có zIndex → copy + sort + paint
        std::vector<std::shared_ptr<RenderNode>> sortedChildren = children;
        std::stable_sort(sortedChildren.begin(), sortedChildren.end(),
          [](const std::shared_ptr<RenderNode>& a, const std::shared_ptr<RenderNode>& b) {
            return a->_zIndex.load(std::memory_order_relaxed) < b->_zIndex.load(std::memory_order_relaxed);
          }
        );
        for (auto& child : sortedChildren) {
          child->paint(canvas);
        }
      }
    }
  }


  if (opacity < 1.0f) {
    canvas->restore(); // restore saveLayerAlpha
  }
  canvas->restore(); // restore save()
}

} // namespace margelo::nitro::skiakit
