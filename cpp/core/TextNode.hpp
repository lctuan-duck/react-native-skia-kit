#pragma once

#include "RenderNode.hpp"
#include <mutex>
#include <unordered_map>
#include <utility>
#include <cstring>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include <include/core/SkCanvas.h>
#include <include/core/SkFontMgr.h>
#include <include/core/SkPaint.h>
#include <modules/skparagraph/include/Paragraph.h>
#include <modules/skparagraph/include/ParagraphBuilder.h>
#include <modules/skparagraph/include/ParagraphStyle.h>
#include <modules/skparagraph/include/TextStyle.h>
#include <modules/skparagraph/include/FontCollection.h>
#pragma clang diagnostic pop

#ifdef ANDROID
#include <include/ports/SkFontMgr_android.h>
#include <include/ports/SkFontScanner_FreeType.h>
#include <include/core/SkFontScanner.h>
#else
#include <include/core/SkFontMgr.h>
#endif

#include <yoga/Yoga.h>

namespace margelo::nitro::skiakit {

struct TextProps {
  std::string content;
  float       fontSize    = 14.f;
  uint32_t    color       = 0xFF000000;  // SkColor ARGB
  std::string fontFamily;
  int         fontWeight  = 400;
  int         maxLines    = 0;           // 0 = không giới hạn
};

/**
 * TextNode — Text drawable với Yoga measure function.
 *
 * Measure cache: Yoga gọi measureText() nhiều lần trong 1 layout pass (binary search).
 * Cache theo (encodedWidth, widthMode) → YGSize để tránh buildParagraph() lặp lại.
 * Cache được xóa khi text/style thay đổi (updateProps).
 *
 * FontCollection được inject từ RenderSubsystem (shared, dùng system fonts).
 */
class TextNode : public RenderNode {
public:
  explicit TextNode(const std::string& id)
    : RenderNode(id, "Text") {
    // Đăng ký Yoga measure function
    YGNodeSetMeasureFunc(yogaNode, &TextNode::yogaMeasureFunc);
  }

  void setFontCollection(sk_sp<skia::textlayout::FontCollection> fc) {
    std::lock_guard<std::mutex> lock(_propMutex);
    _fontCollection = std::move(fc);
  }

  void updateProps(const TextProps& props) {
    std::lock_guard<std::mutex> lock(_propMutex);
    _props = props;
    _measureCache.clear();  // Props thay đổi → invalidate cache
    _paragraph.reset();     // Rebuild paragraph ở lần draw tiếp theo
  }

  void draw(SkCanvas* canvas) override {
    std::lock_guard<std::mutex> lock(_propMutex);

    float w;
    {
      std::shared_lock<std::shared_mutex> lock2(_childrenMutex);
      w = _cachedW;
    }
    if (w <= 0.f) return;

    // Đảm bảo paragraph đã được build với constraint hiện tại
    if (!_paragraph || _lastLayoutWidth != w) {
      _paragraph = buildParagraph(w);
      _lastLayoutWidth = w;
    }

    if (_paragraph) {
      SkPaint paint;
      paint.setColor(_props.color);
      _paragraph->paint(canvas, 0.f, 0.f);
    }
  }

  YGSize measure(float width, int widthMode, float height, int heightMode) {
    std::lock_guard<std::mutex> lock(_propMutex);

    auto key = std::make_pair(encodeFloat(width), widthMode);
    auto it = _measureCache.find(key);
    if (it != _measureCache.end()) {
      return it->second;
    }

    float constraint = (widthMode == YGMeasureModeUndefined) ? 1e9f : width;
    auto para = buildParagraph(constraint);
    YGSize result = {0, 0};
    if (para) {
      result.width  = para->getMaxIntrinsicWidth();
      result.height = para->getHeight();
    }

    _measureCache[key] = result;
    return result;
  }

private:
  TextProps   _props;
  std::mutex  _propMutex;

  sk_sp<skia::textlayout::FontCollection> _fontCollection;
  std::shared_ptr<skia::textlayout::Paragraph> _paragraph;
  float _lastLayoutWidth = -1.f;

  // ── Measure cache ────────────────────────────────────────────────────────
  // Key: (encodedWidth << 4 | widthMode) packed as int64
  // Value: YGSize {width, height}
  struct PairHash {
    size_t operator()(const std::pair<int32_t, int>& p) const noexcept {
      return std::hash<int64_t>()((int64_t)p.first << 32 | (uint32_t)p.second);
    }
  };
  std::unordered_map<std::pair<int32_t, int>, YGSize, PairHash> _measureCache;

  static int32_t encodeFloat(float f) {
    int32_t bits;
    std::memcpy(&bits, &f, sizeof(bits));
    return bits;
  }

  // ── Yoga measure callback ─────────────────────────────────────────────────
  static YGSize yogaMeasureFunc(
      YGNodeConstRef node,
      float width, YGMeasureMode widthMode,
      float /*height*/, YGMeasureMode /*heightMode*/)
  {
    auto* self = static_cast<TextNode*>(YGNodeGetContext(const_cast<YGNodeRef>(node)));
    if (!self) return {0, 0};

    std::lock_guard<std::mutex> lock(self->_propMutex);

    auto key = std::make_pair(encodeFloat(width), static_cast<int>(widthMode));
    auto it = self->_measureCache.find(key);
    if (it != self->_measureCache.end()) {
      return it->second;  // Cache hit — tránh buildParagraph lặp lại
    }

    float constraint = (widthMode == YGMeasureModeUndefined) ? 1e9f : width;
    auto para = self->buildParagraph(constraint);
    YGSize result = {0, 0};
    if (para) {
      result.width  = para->getMaxIntrinsicWidth();
      result.height = para->getHeight();
    }

    self->_measureCache[key] = result;
    return result;
  }

  // ── Paragraph builder ─────────────────────────────────────────────────────
  std::shared_ptr<skia::textlayout::Paragraph> buildParagraph(float widthConstraint) {
    // KHÔNG lock _propMutex ở đây — caller đã giữ lock
    using namespace skia::textlayout;

    TextStyle style;
    style.setFontSize(_props.fontSize);
    style.setColor(_props.color);
    if (!_props.fontFamily.empty()) {
      style.setFontFamilies({SkString(_props.fontFamily.c_str())});
    }
    // Font weight
    SkFontStyle::Weight weight = static_cast<SkFontStyle::Weight>(_props.fontWeight);
    style.setFontStyle(SkFontStyle(weight, SkFontStyle::kNormal_Width, SkFontStyle::kUpright_Slant));

    ParagraphStyle paraStyle;
    if (_props.maxLines > 0) {
      paraStyle.setMaxLines(static_cast<size_t>(_props.maxLines));
      paraStyle.setEllipsis(u"\u2026");
    }

    auto& fc = _fontCollection ? _fontCollection : getDefaultFontCollection();
    auto builder = skia::textlayout::ParagraphBuilder::make(paraStyle, fc);
    builder->pushStyle(style);
    builder->addText(_props.content.c_str());

    auto para = builder->Build();
    para->layout(widthConstraint > 0 ? widthConstraint : 10000.f);
    return para;
  }

  static sk_sp<skia::textlayout::FontCollection>& getDefaultFontCollection() {
    static sk_sp<skia::textlayout::FontCollection> fc;
    if (!fc) {
      fc = sk_make_sp<skia::textlayout::FontCollection>();
#ifdef ANDROID
      fc->setDefaultFontManager(SkFontMgr_New_Android(nullptr, SkFontScanner_Make_FreeType()));
#endif
      fc->enableFontFallback();
    }
    return fc;
  }
};

} // namespace margelo::nitro::skiakit
