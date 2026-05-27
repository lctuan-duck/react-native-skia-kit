#pragma once

#include "BoxNode.hpp"
#include <atomic>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include <include/core/SkCanvas.h>
#pragma clang diagnostic pop

namespace margelo::nitro::skiakit {

/**
 * ScrollNode — Scrollable container.
 *
 * Kế thừa BoxNode để có background/border/shadow.
 * Thêm:
 *   - Viewport clipping: chỉ hiển thị nội dung trong bounds của node
 *   - Scroll offset transform: translate children theo scrollOffset
 *
 * scrollOffset dùng std::atomic<float> vì:
 *   - Reanimated worklet (Render thread / UI thread) ghi trực tiếp qua updateScrollNodeOffset
 *   - paint() đọc trên Skia Render thread
 *   Atomic load/store đảm bảo consistency mà không cần mutex trong hot path.
 */
class ScrollNode : public BoxNode {
public:
  explicit ScrollNode(const std::string& id, bool horizontal)
    : BoxNode(id), _horizontal(horizontal) {
    type = "Scroll";
  }

  /**
   * Cập nhật scroll offset — gọi từ Reanimated worklet hoặc JS.
   * atomic store đảm bảo Render thread thấy giá trị mới nhất.
   */
  void setScrollOffset(float offset) {
    _scrollOffset.store(offset, std::memory_order_relaxed);
  }

  float getScrollOffset() const {
    return _scrollOffset.load(std::memory_order_relaxed);
  }

  /**
   * Override paint() để thêm clip viewport + scroll translation.
   * Không gọi BoxNode::paint() để tránh double-translate.
   */
  void paint(SkCanvas* canvas) override {
    float x, y, w, h;
    {
      std::shared_lock<std::shared_mutex> lock(_childrenMutex);
      x = getX(); y = getY();
      w = getWidth(); h = getHeight();
    }
    if (w <= 0.f || h <= 0.f) return;

    canvas->save();
    canvas->translate(x, y);

    // 1. Draw background/border của ScrollNode chính (gọi BoxNode::draw, không phải paint)
    BoxNode::draw(canvas);

    // 2. Clip viewport — chỉ render nội dung trong bounds
    canvas->clipRect(SkRect::MakeWH(w, h), true /* antiAlias */);

    // 3. Translate content theo scroll offset (sau khi đã clip)
    // Lưu lại state trước khi scroll để lát vẽ scrollbar
    canvas->save();
    
    const float offset = _scrollOffset.load(std::memory_order_relaxed);
    if (_horizontal) {
      canvas->translate(-offset, 0.f);
    } else {
      canvas->translate(0.f, -offset);
    }

    // 4. Vẽ đệ quy children (bên trong clip + scroll)
    float contentW = 0.f, contentH = 0.f;
    {
      std::shared_lock<std::shared_mutex> lock(_childrenMutex);
      for (auto& child : children) {
        child->paint(canvas);
      }
      if (!children.empty()) {
        contentW = children[0]->getWidth();
        contentH = children[0]->getHeight();
      }
    }

    // 5. Restore để huỷ scroll translation (vẫn giữ clip và transform ban đầu)
    canvas->restore();

    if (!_horizontal && contentH > h) {
      float maxScroll = contentH - h;
      float offsetClamped = std::max(0.f, std::min(offset, maxScroll));
      float barH = std::max(20.f, (h / contentH) * h);
      float barY = (offsetClamped / maxScroll) * (h - barH);
      
      SkPaint paint;
      paint.setColor(SkColorSetARGB(100, 150, 150, 150));
      paint.setAntiAlias(true);
      SkRect barRect = SkRect::MakeXYWH(w - 6.f, barY + 2.f, 4.f, barH - 4.f);
      canvas->drawRoundRect(barRect, 2.f, 2.f, paint);
    } else if (_horizontal && contentW > w) {
      float maxScroll = contentW - w;
      float offsetClamped = std::max(0.f, std::min(offset, maxScroll));
      float barW = std::max(20.f, (w / contentW) * w);
      float barX = (offsetClamped / maxScroll) * (w - barW);
      
      SkPaint paint;
      paint.setColor(SkColorSetARGB(100, 150, 150, 150));
      paint.setAntiAlias(true);
      SkRect barRect = SkRect::MakeXYWH(barX + 2.f, h - 6.f, barW - 4.f, 4.f);
      canvas->drawRoundRect(barRect, 2.f, 2.f, paint);
    }

    // Restore the clipRect and initial translate
    canvas->restore();
  }

private:
  const bool        _horizontal;
  std::atomic<float> _scrollOffset{0.f};
};

} // namespace margelo::nitro::skiakit
