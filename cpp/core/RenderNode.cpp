#include "RenderNode.hpp"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include <include/core/SkCanvas.h>
#pragma clang diagnostic pop

namespace margelo::nitro::skiakit {

void RenderNode::paint(SkCanvas* canvas) {
  // Đọc state từ cache — an toàn trên Render thread
  float x, y, opacity;
  {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    x = _cachedX;
    y = _cachedY;
    opacity = _opacity;
  }

  // Nếu opacity = 0, skip render hoàn toàn
  if (opacity <= 0.0f) return;

  canvas->save();

  if (opacity < 1.0f) {
    // Dùng 255 làm chuẩn, cast sang U8
    int alpha = static_cast<int>(opacity * 255.0f);
    // Lưu ý: saveLayer có thể tốn kém nếu lạm dụng, nhưng là cách duy nhất để opacity áp dụng cho cả group
    canvas->saveLayerAlpha(nullptr, alpha);
  }

  canvas->translate(x, y);

  // 1. Vẽ chính node
  draw(canvas);

  // 2. Vẽ đệ quy children — shared_lock cho phép concurrent reads
  {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    for (auto& child : children) {
      child->paint(canvas);
    }
  }

  if (opacity < 1.0f) {
    canvas->restore(); // restore saveLayerAlpha
  }
  canvas->restore(); // restore save()
}

} // namespace margelo::nitro::skiakit
