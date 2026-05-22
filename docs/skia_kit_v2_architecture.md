# Kiến trúc SkiaKit v2: Custom React Reconciler & C++ Engine

Tài liệu này mô tả chi tiết thiết kế và kế hoạch nâng cấp thư viện `react-native-skia-kit` lên phiên bản **v2**. 

Kiến trúc mới hướng tới mục tiêu tối ưu hóa hiệu năng cực hạn bằng cách chuyển toàn bộ logic quản lý cây bố cục (Yoga), định hình văn bản (Text Shaping), và vẽ đồ họa (Skia) xuống tầng **C++ Native**, loại bỏ hoàn toàn gánh nặng xử lý của React Component thông thường ở JS thread.

---

## 1. Tổng quan Luồng Hoạt động (Architectural Overview)

Trong phiên bản v2, ứng dụng chỉ render **duy nhất 1 component Canvas thực tế** của `@shopify/react-native-skia` tại gốc. Các component giao diện như `<Box>`, `<Text>`, `<Image>` được viết bằng React JSX nhưng hoạt động như các **Virtual Drawing Nodes**. Chúng không sinh ra bất kỳ View Native hay component React nào khác mà đồng bộ trực tiếp cấu trúc cây xuống C++ qua JSI.

```mermaid
graph TD
    subgraph Tầng React JSX (JS Thread)
        RootCanvas[<SkiaKitCanvas>] --> BoxJS[<Box style={{...}}>]
        BoxJS --> TextJS[<Text content="Hello" />]
    end

    subgraph JSI Bridge (Nitro Modules)
        BoxJS -- JSI: createBoxNode --> BoxNode
        TextJS -- JSI: createTextNode --> TextNode
    end

    subgraph C++ Rendering Engine (Native GPU Thread)
        RootNode[Root Node] --> BoxNode[BoxNode: Skia + Yoga]
        BoxNode --> TextNode[TextNode: Custom Measure + Paint]
        
        Engine[UIEngine] -->|1. Calculate Layout| Yoga[Yoga Flexbox]
        Engine -->|2. Direct Draw Pass| Skia[Skia Canvas C++]
    end
```

---

## 2. Đặc tả C++ Rendering Engine

### 2.1. Lớp Cơ sở `RenderNode` (`cpp/core/RenderNode.hpp`)
Mọi đối tượng vẽ trong hệ thống đều kế thừa từ `RenderNode`. Lớp này tích hợp trực tiếp một Yoga Node (`YGNodeRef`) để quản lý vị trí, kích thước, và luồng vẽ đệ quy.

> **Thread Safety:** `children` được access từ cả **JS thread** (Reconciler: addChild/removeChild) lẫn **Render thread** (Shopify: paint). Cần `std::shared_mutex` — writer (JS) dùng `unique_lock`, reader (Render) dùng `shared_lock`.

> **Yoga Destructor:** Gọi `YGNodeFree` khi node vẫn có parent trong Yoga tree sẽ **crash**. Phải unlink trước.

```cpp
#pragma once
#include <string>
#include <vector>
#include <memory>
#include <algorithm>
#include <shared_mutex>  // C++17
#include <yoga/Yoga.h>
#include <SkCanvas.h>

namespace margelo::nitro::skiakit {

  class RenderNode : public std::enable_shared_from_this<RenderNode> {
  public:
    std::string id;
    std::string type;
    YGNodeRef yogaNode = nullptr;
    std::weak_ptr<RenderNode> parent;
    std::vector<std::shared_ptr<RenderNode>> children;

    RenderNode(const std::string& nodeId, const std::string& nodeType)
      : id(nodeId), type(nodeType) {
      yogaNode = YGNodeNew();
      YGNodeSetContext(yogaNode, this);
    }

    virtual ~RenderNode() {
      if (yogaNode) {
        // [FIX] Phải unlink khỏi parent Yoga trước khi free — tránh crash
        YGNodeRef yogaParent = YGNodeGetParent(yogaNode);
        if (yogaParent) {
          YGNodeRemoveChild(yogaParent, yogaNode);
        }
        // KHÔNG dùng YGNodeFreeRecursive — children được quản lý bởi shared_ptr
        YGNodeFree(yogaNode);
        yogaNode = nullptr;
      }
    }

    // [JS Thread] Ghi vào children + Yoga tree — exclusive write lock
    void addChild(const std::shared_ptr<RenderNode>& child) {
      std::unique_lock<std::shared_mutex> lock(_childrenMutex);
      children.push_back(child);
      child->parent = shared_from_this();
      uint32_t index = static_cast<uint32_t>(children.size() - 1);
      YGNodeInsertChild(yogaNode, child->yogaNode, index);
    }

    // [JS Thread] Xoá khỏi children + Yoga tree — exclusive write lock
    void removeChild(const std::shared_ptr<RenderNode>& child) {
      std::unique_lock<std::shared_mutex> lock(_childrenMutex);
      auto it = std::find(children.begin(), children.end(), child);
      if (it != children.end()) {
        YGNodeRemoveChild(yogaNode, child->yogaNode);
        children.erase(it);
      }
    }

    // [Render Thread] Shopify draw callback gọi — shared read lock (non-blocking với readers khác)
    virtual void paint(SkCanvas* canvas) {
      canvas->save();
      float x = YGNodeLayoutGetLeft(yogaNode);
      float y = YGNodeLayoutGetTop(yogaNode);
      canvas->translate(x, y);

      draw(canvas);

      // shared_lock — nhiều Render threads có thể đọc children đồng thời
      std::shared_lock<std::shared_mutex> lock(_childrenMutex);
      for (auto& child : children) {
        child->paint(canvas);
      }
      canvas->restore();
    }

    // Hàm ảo bắt buộc ghi đè để thực hiện lệnh vẽ Skia của riêng từng Widget
    virtual void draw(SkCanvas* canvas) = 0;
  };

}
```

### 2.2. Lớp C++ `BoxNode` (`cpp/core/BoxNode.hpp`)
`BoxNode` đóng vai trò là một container vẽ. Nó chịu trách nhiệm vẽ bóng đổ (shadow/elevation), màu nền (background), bo góc (borderRadius), đường viền (border) và cắt khung con (overflow clipping).

> **Thứ tự vẽ đúng:** Shadow → Clip → Background → Border. Clip phải xảy ra trước background để border được inset đúng cách (dùng `makeInset(borderWidth/2)` để toàn bộ stroke nằm trong bounds).

```cpp
class BoxNode : public RenderNode {
public:
  SkColor backgroundColor = SK_ColorTRANSPARENT;
  float borderRadius = 0.0f;
  float borderWidth = 0.0f;
  SkColor borderColor = SK_ColorTRANSPARENT;
  float elevation = 0.0f;
  bool overflowHidden = false;

  BoxNode(const std::string& id) : RenderNode(id, "Box") {}

  void draw(SkCanvas* canvas) override {
    float w = YGNodeLayoutGetWidth(yogaNode);
    float h = YGNodeLayoutGetHeight(yogaNode);
    if (w <= 0 || h <= 0) return;

    SkRect rect = SkRect::MakeWH(w, h);
    SkPaint paint;
    paint.setAntiAlias(true);

    // 1. Vẽ bóng đổ (Elevation Shadow) — trước clip để shadow không bị cắt
    if (elevation > 0.0f) {
      SkPaint shadowPaint;
      shadowPaint.setAntiAlias(true);
      shadowPaint.setColor(SkColorSetARGB(40, 0, 0, 0));
      shadowPaint.setMaskFilter(SkMaskFilter::MakeBlur(kNormal_SkBlurStyle, elevation));
      canvas->save();
      canvas->translate(0, elevation / 2.0f);
      if (borderRadius > 0.0f) {
        canvas->drawRoundRect(rect, borderRadius, borderRadius, shadowPaint);
      } else {
        canvas->drawRect(rect, shadowPaint);
      }
      canvas->restore();
    }

    // 2. Overflow clip — đặt TRƯỚC background và border
    // Children (được vẽ bởi base class paint() sau draw()) sẽ bị clip bởi scope này
    if (overflowHidden) {
      if (borderRadius > 0.0f) {
        SkPath path;
        path.addRoundRect(rect, borderRadius, borderRadius);
        canvas->clipPath(path, true);
      } else {
        canvas->clipRect(rect, true);
      }
    }

    // 3. Vẽ màu nền
    if (backgroundColor != SK_ColorTRANSPARENT) {
      paint.setColor(backgroundColor);
      paint.setStyle(SkPaint::kFill_Style);
      if (borderRadius > 0.0f) {
        canvas->drawRoundRect(rect, borderRadius, borderRadius, paint);
      } else {
        canvas->drawRect(rect, paint);
      }
    }

    // 4. Vẽ viền (Border) — dùng inset rect để stroke nằm hoàn toàn trong bounds
    // SkPaint::kStroke_Style centered trên edge → inset bằng half strokeWidth
    if (borderWidth > 0.0f && borderColor != SK_ColorTRANSPARENT) {
      paint.setColor(borderColor);
      paint.setStrokeWidth(borderWidth);
      paint.setStyle(SkPaint::kStroke_Style);
      float inset = borderWidth / 2.0f;
      SkRect borderRect = rect.makeInset(inset, inset);
      if (borderRadius > 0.0f) {
        float r = std::max(0.0f, borderRadius - inset);
        canvas->drawRoundRect(borderRect, r, r, paint);
      } else {
        canvas->drawRect(borderRect, paint);
      }
    }
  }
};
```


### 2.3. Lớp C++ `TextNode` (`cpp/core/TextNode.hpp`)
`TextNode` tích hợp **Yoga Measure Function** để Yoga có thể hỏi kích thước văn bản trực tiếp từ Skia Paragraph C++ trong quá trình chạy Layout.

> **Lưu ý quan trọng:** Yoga có thể gọi `measureText` **nhiều lần** trong 1 layout pass (binary search width). Cần cache kết quả theo `(width, widthMode)` để tránh rebuild Paragraph thừa.

```cpp
#include <modules/skparagraph/include/Paragraph.h>
#include <modules/skparagraph/include/ParagraphBuilder.h>
#include <map>

class TextNode : public RenderNode {
public:
  std::string textContent;
  float fontSize = 14.0f;
  SkColor textColor = SK_ColorBLACK;
  std::string fontFamily = "sans-serif";
  int maxLines = 0;  // 0 = không giới hạn
  sk_sp<skia::textlayout::FontCollection> fontCollection;  // Từ RenderSubsystem
  std::shared_ptr<skia::textlayout::Paragraph> paragraph;

  TextNode(const std::string& id) : RenderNode(id, "Text") {
    YGNodeSetMeasureFunc(yogaNode, &TextNode::measureText);
  }

  void updateText(const std::string& text, float size, SkColor color,
                  const std::string& font, int lines = 0) {
    textContent = text;
    fontSize = size;
    textColor = color;
    fontFamily = font;
    maxLines = lines;
    paragraph = nullptr;    // Reset draw cache
    _measureCache.clear();  // Xóa measure cache — text đã thay đổi
    YGNodeMarkDirty(yogaNode);
  }

  void draw(SkCanvas* canvas) override {
    if (textContent.empty()) return;
    float w = YGNodeLayoutGetWidth(yogaNode);
    // Xây dựng Paragraph thực tế dựa trên chiều rộng được phân bổ bởi Yoga
    if (!paragraph) {
      paragraph = buildParagraph(w);
    }
    paragraph->paint(canvas, 0, 0);
  }

private:
  // Cache: key = (width_encoded, widthMode) → kết quả đo
  // Yoga gọi measureText nhiều lần với width khác nhau trong 1 pass → cache tránh O(N) builds
  std::map<std::pair<int32_t, int>, YGSize> _measureCache;

  // Encode float thành int32 để dùng làm map key an toàn
  static int32_t encodeWidth(float w) {
    return *reinterpret_cast<const int32_t*>(&w);
  }

  std::shared_ptr<skia::textlayout::Paragraph> buildParagraph(float widthConstraint) {
    using namespace skia::textlayout;
    TextStyle style;
    style.setFontSize(fontSize);
    style.setColor(textColor);
    if (!fontFamily.empty()) {
      style.setFontFamilies({SkString(fontFamily.c_str())});
    }

    ParagraphStyle paraStyle;
    if (maxLines > 0) {
      paraStyle.setMaxLines(maxLines);
      paraStyle.setEllipsis(u"\u2026");  // "…"
    }

    // fontCollection được inject từ RenderSubsystem (dùng system fonts)
    auto& fc = fontCollection ? fontCollection : getDefaultFontCollection();
    ParagraphBuilder builder(paraStyle, fc);
    builder.pushStyle(style);
    builder.addText(textContent.c_str());

    auto para = builder.Build();
    para->layout(widthConstraint > 0 ? widthConstraint : 10000.0f);
    return para;
  }

  static sk_sp<skia::textlayout::FontCollection>& getDefaultFontCollection() {
    static sk_sp<skia::textlayout::FontCollection> fc;
    if (!fc) {
      fc = sk_make_sp<skia::textlayout::FontCollection>();
      fc->setDefaultFontManager(SkFontMgr::RefDefault());
      fc->enableFontFallback();
    }
    return fc;
  }

  // Yoga Measure Callback — có thể gọi nhiều lần trong 1 layout pass
  static YGSize measureText(YGNodeRef node, float width, YGMeasureMode widthMode,
                             float /*height*/, YGMeasureMode /*heightMode*/) {
    auto* textNode = static_cast<TextNode*>(YGNodeGetContext(node));

    // 1. Kiểm tra cache trước
    auto key = std::make_pair(encodeWidth(width), (int)widthMode);
    auto cacheIt = textNode->_measureCache.find(key);
    if (cacheIt != textNode->_measureCache.end()) {
      return cacheIt->second;  // Cache hit — không cần build paragraph
    }

    // 2. Cache miss — build paragraph và lưu kết quả
    float constrainedW = (widthMode == YGMeasureModeUndefined || width <= 0)
                            ? 10000.0f
                            : width;
    auto tempPara = textNode->buildParagraph(constrainedW);
    YGSize result = {
      static_cast<float>(tempPara->getMaxIntrinsicWidth()),
      static_cast<float>(tempPara->getHeight())
    };
    textNode->_measureCache[key] = result;
    return result;
  }
};
```

---

## 3. Custom React Reconciler (`src/core/SkiaKitReconciler.ts`)

Sử dụng thư viện `react-reconciler` để chặn luồng JSX và chuyển đổi trực tiếp các thao tác mount, update, unmount thành các cuộc gọi JSI xuống C++.

```typescript
import Reconciler from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants';
import { uiEngine } from './GlobalEngine';
import { buildNativeStyle } from '../hooks/useNativeYogaLayout';

const hostConfig: Reconciler.HostConfig<
  string,       // type ('Box', 'Text', 'Image')
  any,          // props
  string,       // container (Root Canvas ID)
  string,       // instance (Widget ID)
  never, never, never, never, never, never, never, never, never
> = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  createInstance(type, props, _rootContainer, hostContext: { canvasId: string }) {
    const id = props.id || `widget_${Math.random().toString(36).substr(2, 9)}`;
    const yogaStyle = buildNativeStyle(props.style);
    const bg = parseColor(props.style?.backgroundColor);
    const bc = parseColor(props.style?.borderColor);

    if (type === 'Box') {
      uiEngine.createBoxNode(id, yogaStyle, {
        backgroundColor: bg,
        borderRadius: props.style?.borderRadius ?? 0,
        borderWidth: props.style?.borderWidth ?? 0,
        borderColor: bc,
        elevation: props.elevation ?? 0,
        overflowHidden: props.style?.overflow === 'hidden',
      });
    } else if (type === 'Text') {
      uiEngine.createTextNode(id, yogaStyle, {
        content: String(props.text ?? props.children ?? ''),
        fontSize: props.style?.fontSize ?? 14,
        color: parseColor(props.style?.color) ?? 0xFF000000,
        fontFamily: props.style?.fontFamily ?? '',
        fontWeight: props.style?.fontWeight ?? 400,
        numberOfLines: props.numberOfLines ?? 0,
      });
    } else if (type === 'Image') {
      uiEngine.createImageNode(id, props.source?.uri ?? '');
    } else if (type === 'Scroll') {
      uiEngine.createScrollNode(id, props.horizontal ?? false);
    }

    registerJSCallbacks(id, props);
    // Trả về id — Reconciler sẽ dùng nó làm `instance` cho tất cả các lifecycle call
    return id;
  },

  appendInitialChild(parentInstance, childInstance) {
    uiEngine.addRenderChild(parentInstance, childInstance);
  },

  appendChild(parentInstance, childInstance) {
    uiEngine.addRenderChild(parentInstance, childInstance);
  },

  // [NEW] appendChildToContainer: gọn root-level node vào cây — container = canvasId
  appendChildToContainer(container: string, childInstance: string) {
    uiEngine.addRenderChild(container, childInstance);
  },

  removeChild(parentInstance, childInstance) {
    // [FIX] removeRenderNode xử lý recursive cleanup trong C++ — không lịp nững gọi ở JS
    uiEngine.removeRenderChild(parentInstance, childInstance);
    uiEngine.removeRenderNode(childInstance);  // Recursive trong C++
    unregisterJSCallbacks(childInstance);
  },

  // [NEW] removeChildFromContainer: xóa root-level node
  removeChildFromContainer(container: string, childInstance: string) {
    uiEngine.removeRenderChild(container, childInstance);
    uiEngine.removeRenderNode(childInstance);
    unregisterJSCallbacks(childInstance);
  },

  commitUpdate(instance, updatePayload, type, _oldProps, newProps) {
    if (!updatePayload) return;
    const yogaStyle = buildNativeStyle(newProps.style);
    const bg = parseColor(newProps.style?.backgroundColor);
    const bc = parseColor(newProps.style?.borderColor);

    if (type === 'Box') {
      uiEngine.updateBoxNode(instance, yogaStyle, {
        backgroundColor: bg,
        borderRadius: newProps.style?.borderRadius ?? 0,
        borderWidth: newProps.style?.borderWidth ?? 0,
        borderColor: bc,
        elevation: newProps.elevation ?? 0,
        overflowHidden: newProps.style?.overflow === 'hidden',
      });
    } else if (type === 'Text') {
      uiEngine.updateTextNode(instance, yogaStyle, {
        content: String(newProps.text ?? newProps.children ?? ''),
        fontSize: newProps.style?.fontSize ?? 14,
        color: parseColor(newProps.style?.color) ?? 0xFF000000,
        fontFamily: newProps.style?.fontFamily ?? '',
        fontWeight: newProps.style?.fontWeight ?? 400,
        numberOfLines: newProps.numberOfLines ?? 0,
      });
    }

    registerJSCallbacks(instance, newProps);
  },

  // ── Boilerplate ──────────────────────────────────────────────

  // canvasId được forward xuống toàn cây qua context — createInstance dùng để định danh canvas
  getRootHostContext(rootContainerInstance: string) {
    return { canvasId: rootContainerInstance };
  },
  getChildHostContext(parentHostContext: { canvasId: string }) {
    return parentHostContext;
  },
  shouldSetTextContent: () => false,

  createTextInstance(text: string) {
    const id = `text_auto_${Math.random().toString(36).substr(2, 9)}`;
    uiEngine.createTextNode(id, {}, {
      content: text, fontSize: 14, color: 0xFF000000,
      fontFamily: '', fontWeight: 400, numberOfLines: 0,
    });
    return id;
  },

  finalizeInitialChildren: () => false,

  prepareUpdate(_instance, type, oldProps, newProps) {
    if (type === 'Box') {
      const visualChanged =
        oldProps.style?.backgroundColor !== newProps.style?.backgroundColor ||
        oldProps.style?.borderRadius    !== newProps.style?.borderRadius    ||
        oldProps.style?.borderWidth     !== newProps.style?.borderWidth     ||
        oldProps.style?.borderColor     !== newProps.style?.borderColor     ||
        oldProps.style?.overflow        !== newProps.style?.overflow        ||
        oldProps.elevation              !== newProps.elevation;
      const layoutChanged = !shallowEqualYogaStyle(oldProps.style, newProps.style);
      if (!visualChanged && !layoutChanged) return null;
      return { type };
    }
    if (type === 'Text') {
      const contentChanged =
        (oldProps.text ?? oldProps.children) !== (newProps.text ?? newProps.children) ||
        oldProps.numberOfLines !== newProps.numberOfLines;
      const styleChanged =
        oldProps.style?.fontSize   !== newProps.style?.fontSize   ||
        oldProps.style?.color      !== newProps.style?.color      ||
        oldProps.style?.fontFamily !== newProps.style?.fontFamily ||
        oldProps.style?.fontWeight !== newProps.style?.fontWeight;
      const layoutChanged = !shallowEqualYogaStyle(oldProps.style, newProps.style);
      if (!contentChanged && !styleChanged && !layoutChanged) return null;
      return { type };
    }
    return null;
  },

  getCurrentEventPriority: () => DefaultEventPriority,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  preparePortalMount() {},

  prepareForCommit(containerInfo: string) {
    return containerInfo;
  },

  resetAfterCommit(containerInfo: string) {
    if (containerInfo) {
      uiEngine.markDirty(containerInfo);
      // requestRedraw được inject qua closure từ createSkiaKitHostConfig — xem bên dưới
    }
  },

  clearContainer() {},
};

/**
 * [FIX] createSkiaKitHostConfig — trả về 1 object hostConfig MỚI hoàn toàn (closure riêng biệt)
 * per CanvasRoot. KHÔNG mutation shared state.
 *
 * Mở rộng (scalable): Thêm bất kỳ per-canvas config nào vào đây mà không ảnh hưởng canvas khác.
 */
export function createSkiaKitHostConfig(
  requestRedraw: () => void
): typeof hostConfig {
  return {
    ...hostConfig,
    // Override chỉ phần cần per-canvas closure — tất cả method khác kế thừa từ hostConfig
    resetAfterCommit(containerInfo: string) {
      if (containerInfo) {
        uiEngine.markDirty(containerInfo);  // C++ rebuild SkPicture ở frame tiếp theo
        requestRedraw();                    // Shopify canvas repaint — closure per CanvasRoot
      }
    },
  } as typeof hostConfig;
}

// Export singleton để dùng khi chỉ có 1 CanvasRoot (common case)
export const SkiaKitReconciler = Reconciler(hostConfig);
```
```

---

## 4. Đồng bộ hóa Sự kiện và Tương tác (Gestures & Events)

1.  **JS Event Map**: Các callback tương tác như `onPress`, `onPanUpdate` sẽ được lưu trữ trong một cấu trúc JS Map độc lập (`jsCallbacks = new Map<string, GestureCallbacks>()`) dựa trên ID của Node.
2.  **Hit Testing ở C++**: Khi xảy ra sự kiện chạm trên màn hình, Canvas gốc gửi tọa độ chạm `(x, y)` xuống JSI `uiEngine.hitTest(x, y)`. C++ Engine duyệt cây để xác định phần tử trúng mục tiêu và trả về ID.
3.  **Kích hoạt Callback**: JS nhận lại ID từ C++ và kích hoạt callback tương ứng từ Map.
4.  **Cuộn & Hiệu ứng Cử chỉ ở Native**: C++ sẽ quản lý trực tiếp Scroll Offset và Scroll Physics của `ScrollView` để việc vuốt chạm đạt tốc độ 60/120 FPS mượt mà hoàn toàn không bị trễ luồng JS.

---

## 5. Tích hợp Skia C++ của Shopify

Để không làm tăng kích thước bộ cài (Build size) và tránh cấu hình biên dịch Skia C++ phức tạp, dự án sẽ **liên kết trực tiếp (Static Link)** với thư viện Skia có sẵn của `@shopify/react-native-skia` trong thư mục `node_modules`.

### 5.1. Liên kết Android (`android/CMakeLists.txt`)
```cmake
set(RNSKIA_DIR "${CMAKE_SOURCE_DIR}/../../../node_modules/@shopify/react-native-skia")

# Thêm include headers của Skia C++
include_directories(
  "${RNSKIA_DIR}/cpp"
  "${RNSKIA_DIR}/cpp/api"
  "${RNSKIA_DIR}/cpp/skia/include/core"
  "${RNSKIA_DIR}/cpp/skia/include/utils"
  "${RNSKIA_DIR}/cpp/skia/modules/skparagraph/include"
)

# Link với thư viện tĩnh rnskia (đã được build sẵn bởi Shopify)
add_library(rnskia SHARED IMPORTED)
set_target_properties(rnskia PROPERTIES IMPORTED_LOCATION 
  "${RNSKIA_DIR}/android/build/intermediates/library_jni/release/jni/${ANDROID_ABI}/librnskia.so"
)

target_link_libraries(
  ${PACKAGE_NAME}
  rnskia
  android
  log
)
```

### 5.2. Liên kết iOS (`SkiaKit.podspec`)
```ruby
s.pod_target_xcconfig = {
  'HEADER_SEARCH_PATHS' => [
    '"$(PODS_ROOT)/../node_modules/@shopify/react-native-skia/cpp"',
    '"$(PODS_ROOT)/../node_modules/@shopify/react-native-skia/cpp/api"',
    '"$(PODS_ROOT)/../node_modules/@shopify/react-native-skia/cpp/skia/include/core"',
    '"$(PODS_ROOT)/../node_modules/@shopify/react-native-skia/cpp/skia/modules/skparagraph/include"',
  ].join(' ')
}
# Shopify Skia được auto-link qua CocoaPods dependency — không cần link .a thủ công
s.dependency 'RNSkia'
```

### 5.3. Trích xuất Canvas JSI + SkPicture Caching

**Cách đúng và an toàn để lấy `SkCanvas*`** là dùng `useDrawCallback` của Shopify Skia ở phía JS. Tuy nhiên, **không nên traverse toàn bộ cây mỗi frame** — cần dùng `SkPicture` làm cache layer.

#### ❌ Naive approach (KHÔNG làm vậy)
```typescript
// Gọi mỗi frame → duyệt toàn bộ cây 60 lần/giây kể cả khi UI tĩnh
const onDraw = useDrawCallback((canvas) => {
  uiEngine.drawTree(canvasId, canvas); // BAD: O(N) × 60fps wasted work
}, [canvasId]);
```

**Vấn đề:**
- Tree traversal O(N) × 60fps = hàng nghìn lần/giây dù UI không đổi
- JSI call overhead mỗi frame
- Không tận dụng GPU command caching của Skia

---

#### ✅ Đúng: SkPicture Recording + Dirty Flag

Đây là pattern mà Shopify dùng cho `RNSkPictureView` nội bộ của họ:

```
Khi tree THAY ĐỔI (Reconciler commit):
  └─ markDirty() → rebuildPicture()  ← record draw commands 1 lần

Mỗi frame (60fps):
  └─ drawPicture(cachedPicture)       ← replay cached commands, cực nhanh
```

**JS side (`CanvasRoot.tsx`):**
```typescript
import { Canvas, useDrawCallback } from '@shopify/react-native-skia';

// info.width/height được Shopify truyền vào — cần để record đúng kích thước
const onDraw = useDrawCallback((canvas, info) => {
  uiEngine.drawTree(canvasId, canvas, info.width, info.height);
}, [canvasId]);

return <Canvas style={style} onDraw={onDraw} />;
```

**C++ side — `RenderSubsystem` với SkPicture cache:**
```cpp
#include "api/JsiSkCanvas.h"
#include "include/core/SkPictureRecorder.h"
#include "include/core/SkBBHFactory.h"   // RTree spatial index

class RenderSubsystem {
  std::atomic<bool> _isDirty{true};
  sk_sp<SkPicture> _cachedPicture;    // Cache scene tĩnh
  std::mutex _pictureMutex;

public:
  // Gọi từ Reconciler sau mỗi commit (createNode/updateNode/addChild...)
  void markDirty() { _isDirty.store(true); }

private:
  // Chỉ gọi khi _isDirty = true (1 lần mỗi batch commit)
  void rebuildPicture(const std::string& rootId, float w, float h) {
    SkPictureRecorder recorder;
    // RTreeFactory: tối ưu spatial culling — chỉ replay nodes trong viewport
    SkRTreeFactory bbhFactory;
    SkCanvas* recordCanvas = recorder.beginRecording(
      SkRect::MakeWH(w, h), &bbhFactory
    );
    auto it = _nodes.find(rootId);
    if (it != _nodes.end()) {
      it->second->paint(recordCanvas);
    }
    std::lock_guard<std::mutex> lock(_pictureMutex);
    _cachedPicture = recorder.finishRecordingAsPicture();
    _isDirty.store(false);
  }

public:
  // Gọi từ useDrawCallback — chạy trên Render thread (UI thread của Skia)
  void drawTree(const std::string& rootId, SkCanvas* canvas, float w, float h) {
    // Chỉ rebuild khi thực sự có thay đổi từ Reconciler
    if (_isDirty.load()) {
      rebuildPicture(rootId, w, h);
    }
    // Mỗi frame chỉ replay picture — O(1) CPU, GPU cache hit
    std::lock_guard<std::mutex> lock(_pictureMutex);
    if (_cachedPicture) {
      canvas->drawPicture(_cachedPicture.get());
    }
  }
};
```

#### 🎬 Xử lý Animations (2-Layer Architecture)

Khi có animation (scroll, opacity transition...), cần tách thành 2 layer để tránh rebuild SkPicture mỗi frame:

```cpp
void drawTree(const std::string& rootId, SkCanvas* canvas, float w, float h) {
  // Layer 1: Static content — từ SkPicture cache
  if (_isDirty.load()) rebuildPicture(rootId, w, h);
  {
    std::lock_guard<std::mutex> lock(_pictureMutex);
    if (_cachedPicture) canvas->drawPicture(_cachedPicture.get());
  }

  // Layer 2: Dynamic content — paint trực tiếp lên trên
  // Chỉ các nodes được đánh dấu setWidgetDynamic(true) mới vẽ ở đây
  // VD: ScrollNode khi đang scroll, hay node đang chạy opacity animation
  for (auto& [id, node] : _dynamicNodes) {
    node->paintDynamic(canvas);  // vẽ đè, không cần rebuild picture
  }
}
```

**Lợi ích của 2-layer:**
| | Layer 1 (Static) | Layer 2 (Dynamic) |
|---|---|---|
| Trigger | Khi Reconciler commit | Mỗi frame (khi đang animate) |
| Chi phí | ~0 (drawPicture replay) | O(K) với K = nodes đang animate |
| Ví dụ | Background, text tĩnh, layout | Scroll offset, fade in/out |

---

## 6. Phân tích: Có nên tự quản lý Canvas Surface không?

### 6.1. So sánh 3 phương án

| Tiêu chí | **Phương án A: Giữ `<Canvas>` của Shopify** ✅ | **Phương án B: Tự tạo SkSurface C++** ❌ | **Phương án C: Hybrid (Đề xuất)** ✅✅ |
|---|---|---|---|
| Quản lý GPU Surface | Shopify lo | Tự làm (EGL/Metal) | Shopify lo |
| Tích hợp với OS lifecycle | Tự động | Phải handle thủ công | Tự động |
| Kích thước thêm vào bundle | 0 (đã có sẵn) | Lớn (cần thêm EGL/Metal boilerplate) | 0 |
| Quyền kiểm soát draw loop | Thấp | Cao | **Trung bình-Cao** |
| Rủi ro | Thấp | Cao | Thấp |
| Thời gian implement | Nhanh | Rất lâu | Nhanh |

### 6.2. Kết luận: Dùng Phương án C — Hybrid

**Giữ `<Canvas>` của Shopify** nhưng thay toàn bộ nội dung render bằng `useDrawCallback` → `uiEngine.drawTree()`. Lý do:

1. **`RNSkPlatformContext`** của Shopify đã xử lý: GPU context (OpenGL/Vulkan/Metal), Surface recreation khi xoay màn hình, Pixel density, Font manager (`createFontMgr()`).
2. **`JsiSkCanvas.h`** đã expose `getCanvas() → SkCanvas*` — có thể lấy raw pointer trong scope của draw callback mà không cần hack nội bộ.
3. **FontCollection**: `RNSkPlatformContext::createFontMgr()` trả về `sk_sp<SkFontMgr>` — dùng trực tiếp để tạo `FontCollection` cho `TextNode`.
4. **Không tăng bundle size**: Không cần link thêm bất kỳ thư viện nào — đã có sẵn qua `@shopify/react-native-skia`.

### 6.3. Cách lấy FontCollection cho TextNode

Vì `RNSkPlatformContext` cung cấp font manager, `TextNode` cần nhận `sk_sp<SkFontMgr>` khi được tạo:

```cpp
// Lấy FontMgr từ PlatformContext (được truyền vào khi init engine)
class RenderSubsystem {
  sk_sp<SkFontMgr> _fontMgr;  // Lưu lại từ PlatformContext
  
public:
  void initWithPlatformContext(sk_sp<SkFontMgr> fontMgr) {
    _fontMgr = fontMgr;
    // Tạo shared FontCollection một lần duy nhất
    _fontCollection = sk_make_sp<skia::textlayout::FontCollection>();
    _fontCollection->setDefaultFontManager(_fontMgr);
    _fontCollection->enableFontFallback();
  }
};
```

---

## 7. Migration Strategy (Chiến lược chuyển đổi)

### 7.1. Nguyên tắc: Incremental Migration (Không rewrite toàn bộ)

Project hiện có **45 components** đang hoạt động. Chiến lược là migrate **từng nhóm** theo thứ tự dependency:

```
Giai đoạn 1: Foundation C++ (không thay đổi API public)
  └── Thêm RenderSubsystem + RenderNode hierarchy vào C++
  └── Thêm Render APIs vào UIEngine.nitro.ts

Giai đoạn 2: CanvasRoot + Reconciler
  └── Thêm useDrawCallback vào CanvasRoot
  └── Implement SkiaKitReconciler

Giai đoạn 3: Migrate cặp đôi Box + Text (ít dependency nhất)
  └── Box → BoxNode C++
  └── Text → TextNode C++

Giai đoạn 4: Migrate Image
  └── Image → ImageNode C++

Giai đoạn 5: Migrate ScrollView
  └── ScrollView → ScrollNode C++

Giai đoạn 6: Migrate compound components
  └── Button, Card, ListTile... (dùng Box/Text/Image bên trong)
```

### 7.2. Backward Compatibility

- Trong suốt quá trình migration, API surface với người dùng thư viện **không thay đổi**: `<Box>`, `<Text>` props giữ nguyên.
- Chỉ thay đổi bên trong implementation (từ Skia JSX sang C++ RenderNode).

---

## 8. C++ Render Subsystem

### 8.1. Cập nhật Cấu trúc Folder C++

```text
cpp/
├── HybridUIEngine.cpp          # Facade — điều phối 3 subsystem
├── HybridUIEngine.hpp
├── core/
│   ├── Node.hpp                # WidgetNode, ScrollArea (HitTest data)
│   ├── RenderNode.hpp          # Base class — Yoga + draw + children
│   ├── BoxNode.hpp             # Container: bg, shadow, border, clip
│   ├── TextNode.hpp            # Text: Paragraph + Yoga Measure func
│   ├── ImageNode.hpp           # Image: SkImage async load + paint
│   └── ScrollNode.hpp         # ScrollView: clip viewport + offset transform
├── subsystems/
│   ├── HitTestSubsystem.cpp/hpp    # Phase 2 ✅
│   ├── LayoutSubsystem.cpp/hpp     # Phase 3 ✅
│   └── RenderSubsystem.cpp/hpp    # Phase 6 — MỚI
└── strategies/
    ├── IHitTestStrategy.hpp
    ├── LinearHitTest.cpp
    └── QuadTreeHitTest.cpp
```

### 8.2. `RenderSubsystem` — Quản lý cây RenderNode

> **Định hướng mở rộng — Layout:** `RenderSubsystem` KHÔNG tự chạy Yoga (`YGNodeCalculateLayout`). `LayoutSubsystem` là **single source of truth**. Sau mỗi layout pass, `syncLayoutResults(map)` được gọi để cập nhật layout cache của mỗi `RenderNode`. `RenderNode.paint()` chỉ đọc `_cachedLayout` — không gọi Yoga API trong Render thread.
>
> Lợi ích: Dễ swap layout engine (Yoga → bespoke) mà không đụng Render path. Text measure function vẫn dùng Yoga qua `LayoutSubsystem` chứ không qua `RenderSubsystem`.

> **Định hướng mở rộng — Multi-Canvas:** `_nodes` là flat map global (node ID unique). `drawTree(rootId)` chỉ cần `rootId` để bắt đầu traversal — không cần per-canvas sharding. Nếu 2 `CanvasRoot` dùng chung engine, node ID được generate random → không conflict.

> **Định hướng mở rộng — Memory:** `removeRenderNode` **recursive**: xóa node khỏi `_nodes` map đệ quy vào tất cả descendant. Không rely on Reconciler ordering — an toàn trong mọi trường hợp.

```cpp
// cpp/subsystems/RenderSubsystem.hpp
#pragma once
#include <unordered_map>
#include <shared_mutex>
#include <memory>
#include <mutex>
#include "../core/RenderNode.hpp"

namespace margelo::nitro::skiakit {

// Layout result được cập nhật từ LayoutSubsystem sau mỗi calculate pass
struct CachedLayout {
  float x = 0, y = 0, width = 0, height = 0;
};

class RenderSubsystem {
public:
  // Khởi tạo với FontMgr từ Shopify Skia PlatformContext
  void initFontManager(sk_sp<SkFontMgr> fontMgr);

  // Node lifecycle
  void createBoxNode(const std::string& id, const NativeYogaStyle& yogaStyle, const BoxProps& props);
  void createTextNode(const std::string& id, const NativeYogaStyle& yogaStyle, const TextProps& props);
  void createImageNode(const std::string& id, const std::string& uri);
  void createScrollNode(const std::string& id, bool horizontal);

  void updateBoxNode(const std::string& id, const NativeYogaStyle& yogaStyle, const BoxProps& props);
  void updateTextNode(const std::string& id, const NativeYogaStyle& yogaStyle, const TextProps& props);

  void addRenderChild(const std::string& parentId, const std::string& childId);
  void removeRenderChild(const std::string& parentId, const std::string& childId);

  // [FIX] Recursive cleanup — xóa node + toàn bộ descendant khỏi _nodes map
  // An toàn: không rely on Reconciler call order, không leak orphaned nodes.
  void removeRenderNode(const std::string& id);

  // [KEY] Layout sync từ LayoutSubsystem — gọi sau mỗi calculateLayout()
  // RenderSubsystem lưu layout vào CachedLayout per node — Render thread chỉ đọc cache này,
  // không gọi YGNodeLayoutGetLeft/Top trực tiếp (tránh Yoga-in-Render-thread issue).
  void syncLayoutResults(const std::unordered_map<std::string, CachedLayout>& layouts);

  // Đánh dấu dirty — gọi sau mỗi Reconciler batch commit (từ resetAfterCommit)
  void markDirty(const std::string& rootId) { _isDirty.store(true); }

  void updateScrollNodeOffset(const std::string& id, float offset);

  // Vẽ toàn bộ cây — w/h cần thiết để rebuildPicture khi _isDirty = true
  void drawTree(const std::string& rootId, SkCanvas* canvas, float w, float h);

private:
  void removeRenderNodeRecursive(const std::string& id);

  std::unordered_map<std::string, std::shared_ptr<RenderNode>> _nodes;
  std::unordered_map<std::string, CachedLayout> _layoutCache;  // Layout results từ LayoutSubsystem
  sk_sp<skia::textlayout::FontCollection> _fontCollection;
  // [FIX] shared_mutex — writers (Reconciler: createNode/addChild) dùng unique_lock,
  // readers (draw thread: drawTree) dùng shared_lock. Tránh priority inversion với mutex đơn.
  mutable std::shared_mutex _nodesMutex;
};

} // namespace margelo::nitro::skiakit
```

#### Implementation: `removeRenderNode` với Recursive Cleanup

```cpp
// cpp/subsystems/RenderSubsystem.cpp
void RenderSubsystem::removeRenderNode(const std::string& id) {
  std::unique_lock<std::shared_mutex> lock(_nodesMutex);
  removeRenderNodeRecursive(id);  // Đệ quy xóa — lock được giữ trong suốt
}

void RenderSubsystem::removeRenderNodeRecursive(const std::string& id) {
  // NOTE: _nodesMutex được giữ bởi caller (removeRenderNode)
  auto it = _nodes.find(id);
  if (it == _nodes.end()) return;

  // Thu thập child IDs trước khi erase (tránh iterator invalidation)
  std::vector<std::string> childIds;
  {
    std::shared_lock<std::shared_mutex> childLock(it->second->_childrenMutex);
    for (auto& child : it->second->children) {
      childIds.push_back(child->id);
    }
  }

  // Đệ quy vào children trước (depth-first)
  for (auto& childId : childIds) {
    removeRenderNodeRecursive(childId);
  }

  // Xoá node khỏi map và layout cache
  _nodes.erase(it);
  _layoutCache.erase(id);
}
```

#### Implementation: `syncLayoutResults` — Bridge từ LayoutSubsystem

```cpp
void RenderSubsystem::syncLayoutResults(
    const std::unordered_map<std::string, CachedLayout>& layouts) {
  std::unique_lock<std::shared_mutex> lock(_nodesMutex);
  for (auto& [id, layout] : layouts) {
    _layoutCache[id] = layout;
    // Cập nhật vào RenderNode để paint() có thể đọc
    auto it = _nodes.find(id);
    if (it != _nodes.end()) {
      it->second->setCachedLayout(layout.x, layout.y, layout.width, layout.height);
    }
  }
  _isDirty.store(true);  // Layout thay đổi → rebuild SkPicture
}
```

#### Cập nhật `RenderNode::paint()` — Dùng CachedLayout thay vì YGNodeLayoutGetLeft/Top

```cpp
// RenderNode.hpp — thêm fields và setCachedLayout
float _cachedX = 0, _cachedY = 0, _cachedW = 0, _cachedH = 0;

void setCachedLayout(float x, float y, float w, float h) {
  std::unique_lock<std::shared_mutex> lock(_childrenMutex);  // Tái dùng mutex
  _cachedX = x; _cachedY = y; _cachedW = w; _cachedH = h;
}

virtual void paint(SkCanvas* canvas) {
  canvas->save();
  // [FIX] Dùng cached layout thay vì YGNodeLayoutGetLeft/Top — an toàn trên Render thread
  // YGNodeLayoutGetLeft không thread-safe khi LayoutSubsystem đang chạy calculateLayout
  float x, y;
  {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    x = _cachedX; y = _cachedY;
  }
  canvas->translate(x, y);
  draw(canvas);
  {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    for (auto& child : children) {
      child->paint(canvas);
    }
  }
  canvas->restore();
}
```

### 8.3. `ScrollNode` C++ — Specification

`ScrollNode` kế thừa `BoxNode` và thêm:
- **Viewport clipping**: Clip area theo kích thước của node
- **Scroll offset transform**: Translate children theo offset (từ `updateScrollOffset`)
- **Content size**: Tổng chiều cao/rộng của nội dung bên trong (để biết phạm vi scroll)

```cpp
class ScrollNode : public BoxNode {
public:
  std::atomic<float> scrollOffset{0.0f};  // atomic: Reanimated worklet ghi, Render thread đọc
  bool horizontal = false;

  ScrollNode(const std::string& id) : BoxNode(id) { type = "Scroll"; }

  void paint(SkCanvas* canvas) override {
    // [FIX] Dùng _cachedLayout thay vì YGNodeLayoutGetLeft/Top
    float w, h, x, y;
    {
      std::shared_lock<std::shared_mutex> lock(_childrenMutex);
      w = _cachedW; h = _cachedH; x = _cachedX; y = _cachedY;
    }
    canvas->save();
    canvas->translate(x, y);

    // 1. Clip viewport — chỉ hiển thị trong bounds của ScrollNode
    SkRect viewport = SkRect::MakeWH(w, h);
    canvas->clipRect(viewport, true);

    // 2. Translate nội dung theo scroll offset
    if (horizontal) {
      canvas->translate(-scrollOffset, 0);
    } else {
      canvas->translate(0, -scrollOffset);
    }

    // 3. Vẽ chỉ chính nó (không gọi BoxNode::paint để tránh double-translate)
    draw(canvas);
    for (auto& child : children) {
      child->paint(canvas);
    }

    canvas->restore();
  }
};
```

### 8.4. `ImageNode` C++ — Specification

> **[FIX]** `performStreamOperation` truyền `std::unique_ptr<SkStreamAsset>`, không có `getData()`. Cần dùng `SkData::MakeFromStream`. `image` cần `std::mutex` để thread-safe khi gán từ background thread.

```cpp
class ImageNode : public RenderNode {
public:
  sk_sp<SkImage> image;
  std::string uri;
  std::atomic<bool> loading{false};
  std::function<void()> onLoadCallback;  // Inject từ RenderSubsystem để trigger redraw

  ImageNode(const std::string& id) : RenderNode(id, "Image") {}

  // [FIX] Load ảnh async — dùng đúng SkStreamAsset API
  void loadAsync(std::shared_ptr<RNSkia::RNSkPlatformContext> context,
                 std::function<void()> redrawCallback) {
    loading.store(true);
    onLoadCallback = redrawCallback;
    context->performStreamOperation(uri,
      [this](std::unique_ptr<SkStreamAsset> stream) {
        if (!stream) { loading.store(false); return; }
        // Đọc toàn bộ data từ stream
        size_t len = stream->getLength();
        sk_sp<SkData> data = SkData::MakeUninitialized(len);
        stream->read(data->writable_data(), len);
        {
          std::lock_guard<std::mutex> lock(_imageMutex);
          image = SkImages::DeferredFromEncodedData(std::move(data));
        }
        loading.store(false);
        // Trigger canvas redraw sau khi ảnh đã sẵn sàng
        if (onLoadCallback) onLoadCallback();
      }
    );
  }

  void draw(SkCanvas* canvas) override {
    std::lock_guard<std::mutex> lock(_imageMutex);
    if (!image) return;  // Đang load hoặc load lỗi
    float w = YGNodeLayoutGetWidth(yogaNode);
    float h = YGNodeLayoutGetHeight(yogaNode);
    SkRect dst = SkRect::MakeWH(w, h);
    SkPaint paint;
    paint.setAntiAlias(true);
    canvas->drawImageRect(image, dst, SkSamplingOptions(SkFilterMode::kLinear), &paint);
  }

private:
  std::mutex _imageMutex;  // Bảo vệ image pointer khỏi race giữa load thread và draw thread
};
```

---

## 9. Nitro Interface v2 — Bổ sung Render APIs

Bổ sung vào `UIEngine.nitro.ts` các method cho Render Subsystem:

```typescript
export interface UIEngine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // ... (các APIs HitTest + Layout hiện có) ...

  // ================= RENDER TREE (v2) ================= //

  /**
   * [FIX] initRenderEngine KHÔNG thể nhận PlatformContext từ JS — đó là C++ object thuần.
   * Thay vào đó, HybridUIEngine được init với PlatformContext từ platform module setup
   * (JNI_OnLoad trên Android, Module init trên iOS) — xem Section 15.
   * Method này chỉ trigger bước khởi tạo còn lại (ví dụ validate FontCollection đã sẵn sàng).
   */
  initRenderEngine(): void;

  /** Tạo BoxNode trong cây C++ */
  createBoxNode(id: string, yogaStyle: NativeYogaStyle, props: NativeBoxProps): void;
  updateBoxNode(id: string, yogaStyle: NativeYogaStyle, props: NativeBoxProps): void;

  /** Tạo TextNode trong cây C++ */
  createTextNode(id: string, yogaStyle: NativeYogaStyle, props: NativeTextProps): void;
  updateTextNode(id: string, yogaStyle: NativeYogaStyle, props: NativeTextProps): void;

  /** Tạo ImageNode trong cây C++ */
  createImageNode(id: string, uri: string): void;

  /** Tạo ScrollNode trong cây C++ */
  createScrollNode(id: string, horizontal: boolean): void;

  /**
   * [KEY] Sync layout results từ LayoutSubsystem → RenderSubsystem sau mỗi calculateLayout().
   * Gọi từ layoutStore.scheduleBatchedLayout() sau khi getAllLayouts() trả về.
   * RenderNode.paint() đọc từ cache này thay vì gọi YGNodeLayoutGetLeft/Top trực tiếp.
   */
  syncLayoutResults(layouts: Record<string, { x: number; y: number; width: number; height: number }>): void;

  /** Cập nhật scroll offset của ScrollNode từ Reanimated worklet (không rebuild SkPicture) */
  updateScrollNodeOffset(id: string, offset: number): void;

  /** Đánh dấu dirty để rebuild SkPicture ở frame tiếp theo */
  markDirty(rootId: string): void;

  /** Quản lý cấu trúc cây Render */
  addRenderChild(parentId: string, childId: string): void;
  removeRenderChild(parentId: string, childId: string): void;
  removeRenderNode(id: string): void;

  /**
   * Vẽ toàn bộ cây RenderNode lên SkCanvas.
   * Gọi từ useDrawCallback — canvas chỉ valid trong scope của callback.
   * w/h = kích thước logical pixels (từ info.width/info.height của Shopify).
   */
  drawTree(rootId: string, canvas: SkCanvas, w: number, h: number): void;
}

export interface NativeBoxProps {
  backgroundColor?: number;   // SkColor (ARGB packed int)
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: number;
  elevation?: number;
  overflowHidden?: boolean;
}

export interface NativeTextProps {
  content: string;
  fontSize?: number;
  color?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: string;
  numberOfLines?: number;
}
```

---

## 10. CanvasRoot Redesign (v2)

`CanvasRoot` cần được cập nhật để:
1. **Dùng `useDrawCallback`** + `useCanvasRef` — canvas Shopify là **on-demand**, KHÔNG tự render lại
2. **Cung cấp container** cho `SkiaKitReconciler`
3. **Trigger `canvasRef.current?.redraw()`** sau mỗi batch commit

> **[FIX QUAN TRỌNG]** `useDrawCallback` của Shopify **KHÔNG** phải game loop. Canvas chỉ render khi `requestRedraw()` được gọi (xem `RNSkView.h`). Sau `markDirty()` trong `resetAfterCommit`, phải gọi `canvasRef.current?.redraw()` để canvas thực sự repaint.

```typescript
// src/core/CanvasRoot.tsx (v2)
import { Canvas, useDrawCallback, useCanvasRef } from '@shopify/react-native-skia';
import { createSkiaKitHostConfig, SkiaKitReconciler } from './SkiaKitReconciler';
import Reconciler from 'react-reconciler';

export const CanvasRoot = React.memo(function CanvasRoot({ children, canvasId = 'main', style }) {
  const { width, height } = useWindowDimensions();
  const containerRef = React.useRef<any>(null);
  const reconcilerRef = React.useRef<ReturnType<typeof Reconciler> | null>(null);

  // [FIX] useCanvasRef để có thể gọi redraw() thủ công
  const canvasRef = useCanvasRef();

  // Khởi tạo Reconciler + C++ Render Engine một lần
  React.useLayoutEffect(() => {
    // [FIX] Tạo Reconciler với hostConfig có redraw callback
    // Mỗi CanvasRoot có Reconciler instance riêng để tránh shared-state bug
    const hostConfig = createSkiaKitHostConfig(() => {
      canvasRef.current?.redraw(); // Trigger Shopify canvas repaint
    });
    reconcilerRef.current = Reconciler(hostConfig);

    containerRef.current = reconcilerRef.current.createContainer(
      canvasId,  // container = Canvas ID (dùng bởi prepareForCommit/resetAfterCommit)
      0, null, false, null, '', {}, null
    );
    // initRenderEngine chỉ validate — PlatformContext đã được inject từ module init
    uiEngine.initRenderEngine();
  }, [canvasId]);

  // Cập nhật cây khi children thay đổi
  React.useLayoutEffect(() => {
    if (!containerRef.current || !reconcilerRef.current) return;
    reconcilerRef.current.updateContainer(children, containerRef.current, null, null);
  }, [children]);

  // Draw loop — chạy trên Skia Render thread khi canvas được trigger redraw()
  // info.width/height = logical pixels (KHÔNG nhân pixelDensity — Shopify đã scale canvas)
  const onDraw = useDrawCallback((canvas, info) => {
    uiEngine.drawTree(canvasId, canvas, info.width, info.height);
  }, [canvasId]);

  // Gesture handling giữ nguyên như hiện tại...
  return (
    <RNGestureDetector gesture={composedGesture}>
      <Canvas ref={canvasRef} style={[{ width, height }, style]} onDraw={onDraw} />
    </RNGestureDetector>
  );
});
```

### 10.1. Scroll offset sync từ Reanimated → C++ ScrollNode

Scroll offset do `useScrollPhysics` (Reanimated SharedValue) điều khiển. Bridge sang C++ ScrollNode:

```typescript
// Trong ScrollView.tsx (v2) — thay thế runOnJS pattern
useAnimatedReaction(
  () => scrollOffset.value,
  (offset) => {
    'worklet';
    // Gọi trực tiếp từ worklet — Nitro method khả dụng trên Render thread
    uiEngine.updateScrollNodeOffset(widgetId, offset);
    // [QUAN TRỌNG] Trigger canvas redraw — scroll là dynamic, cần repaint mỗi frame
    // Dùng Reanimated's runOnJS để gọi canvasRef.redraw() trên main thread
    runOnJS(requestCanvasRedraw)(canvasId);
  }
);
```

> **Lưu ý:** `uiEngine.updateScrollNodeOffset` cập nhật `scrollOffset` trên `ScrollNode` và set `_isDirty = false` trên Layer 1 nhưng trigger Layer 2 dynamic repaint — không rebuild SkPicture.
```

---

## 11. Các điểm quan trọng của Reconciler

### 11.1. `parseColor()` — Convert CSS Color String → SkColor

Nitro không tự convert CSS string sang SkColor (ARGB int). Cần helper ở JS side:

```typescript
// src/utils/colorUtils.ts
export function parseColor(css: string | undefined): number | undefined {
  if (!css) return undefined;
  // Hỗ trợ: '#RRGGBB', '#AARRGGBB', 'rgba(r,g,b,a)', 'transparent'
  if (css === 'transparent') return 0x00000000;
  if (css.startsWith('#')) {
    const hex = css.slice(1);
    if (hex.length === 6) return 0xFF000000 | parseInt(hex, 16);
    if (hex.length === 8) {
      // #RRGGBBAA → ARGB
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      const a = parseInt(hex.slice(6,8),16);
      return (a << 24) | (r << 16) | (g << 8) | b;
    }
  }
  if (css.startsWith('rgba')) {
    const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) {
      const a = Math.round((parseFloat(m[4] ?? '1')) * 255);
      return (a << 24) | (parseInt(m[1]!) << 16) | (parseInt(m[2]!) << 8) | parseInt(m[3]!);
    }
  }
  return undefined;
}
```

### 11.2. `prepareUpdate` — Diff Props + `resetAfterCommit` — markDirty

Hai hooks này phối hợp để tối ưu performance của Reconciler:

- **`prepareUpdate`**: Diff props, trả về `null` nếu không đổi → Reconciler **bỏ qua** `commitUpdate` hoàn toàn.
- **`resetAfterCommit`**: Gọi SAU khi toàn bộ batch (có thể gồm nhiều `createInstance`/`commitUpdate`) hoàn tất → trigger rebuild SkPicture **1 lần duy nhất** per batch.

```
Batch commit:
  createInstance('Box')   → uiEngine.createBoxNode()
  commitUpdate('Text')    → uiEngine.updateTextNode()
  commitUpdate('Box')     → null (prepareUpdate → không thay đổi, skip!)
  ↓
resetAfterCommit()        → uiEngine.markDirty()  ← chỉ 1 lần
  ↓
Frame N+1: drawTree()     → rebuildPicture() + drawPicture()
```

### 11.3. Plain Text Node trong JSX

Khi viết `<Box>Hello {name}</Box>`, React truyền plain string vào `createTextInstance`. Thay vì throw error, tự động wrap thành TextNode:

```typescript
// Đã được tích hợp trong hostConfig ở Section 3 (createTextInstance)
createTextInstance(text: string) {
  const id = `text_auto_${Math.random().toString(36).substr(2, 9)}`;
  uiEngine.createTextNode(id, {}, { content: text, fontSize: 14,
    color: 0xFF000000, fontFamily: '', fontWeight: 400, numberOfLines: 0 });
  return id;
},
```

---

## 12. Thread Safety

C++ Render Tree được access từ nhiều thread — cần locking strategy rõ ràng:

| Thread | Thao tác | Lock dùng |
|---|---|---|
| JS Thread (Reconciler) | `createBoxNode`, `updateTextNode`, `addRenderChild` | `unique_lock<shared_mutex>` |
| Skia Render Thread (`drawTree`) | `paint` → đọc `children`, đọc props | `shared_lock<shared_mutex>` |
| Background Image Thread | `loadAsync` → ghi `image` pointer | `lock_guard<mutex>` |

**Chiến lược đã cập nhật (sau review):**

| Resource | Lock type | Lý do |
|---|---|---|
| `RenderSubsystem::_nodes` (map) | `std::shared_mutex _nodesMutex` | Writers: create/remove node; Readers: drawTree lookup |
| `RenderNode::children` (vector) | `std::shared_mutex _childrenMutex` | Writers: addChild/removeChild; Readers: paint() loop |
| `RenderNode` props (boxColor...) | `std::mutex _propMutex` | Writers: updateBoxNode; Readers: draw() |
| `ImageNode::image` (SkImage ptr) | `std::mutex _imageMutex` | Writer: loadAsync callback; Reader: draw() |
| `RenderSubsystem::_cachedPicture` | `std::mutex _pictureMutex` | Writer: rebuildPicture; Reader: drawTree |
| `RenderSubsystem::_isDirty` | `std::atomic<bool>` | Lock-free flag |

> **Tại sao `shared_mutex` thay `mutex` cho children và nodes map?**
> `paint()` chạy trên Render thread và đọc `children` mỗi frame. `std::mutex` blocking cả Render thread dù không có writer — gây frame drop. `std::shared_mutex` cho phép nhiều readers đồng thời, chỉ block khi Reconciler đang ghi.

**Tại sao Canvas của Shopify là on-demand (không continuous):**
- `RNSkView::requestRedraw()` dùng `std::atomic<bool> _redrawRequested` — chỉ schedule render 1 lần
- Draw callback (`onDraw`) chỉ chạy khi canvas được trigger bởi `redraw()` hoặc props thay đổi
- Sau mỗi `markDirty()` phải gọi `canvasRef.current?.redraw()` để canvas thực sự repaint

---

## 13. Kế hoạch Kiểm thử (Testing Strategy)

### 13.1. Unit Test C++
- Framework: **Google Test** (đã có trong Skia source)
- Test `RenderNode::paint()` với mock `SkCanvas`
- Test `TextNode::measureText()` — kiểm tra Yoga measure callback
- Test `HitTestSubsystem` — đã implement

### 13.2. Integration Test JS
- Framework: **Jest** + **React Test Renderer**
- Test `SkiaKitReconciler`: mock `uiEngine`, kiểm tra các JSI calls
- Test `useNativeYogaLayout`: mock `uiEngine.updateLayoutNode`

### 13.3. Visual Regression Test
- Dùng `makeImageSnapshot()` của Shopify Skia để capture frame
- So sánh pixel-level với golden images

### 13.4. Performance Goals
- Target: **60fps** trên thiết bị tầm trung (Android), **120fps** trên iPhone Pro
- JS thread không bị block > 2ms mỗi frame
- Layout batch không vượt quá 5ms cho cây 100 nodes

---

## 14. Thứ tự Implement (Phase Roadmap)

```
Phase 6A — C++ Render Foundation
  ├── [cpp] RenderNode.hpp — với shared_mutex cho children [BLOCKER #7]
  ├── [cpp] BoxNode.hpp, TextNode.hpp (với measure cache)
  ├── [cpp] RenderSubsystem.hpp/cpp — shared_mutex cho _nodes map [BLOCKER #7]
  ├── [cpp] HybridUIEngine: thêm Render APIs + updateScrollNodeOffset
  ├── [nitro] UIEngine.nitro.ts: thêm NativeBoxProps, NativeTextProps, drawTree(w,h), markDirty
  └── [build] CMakeLists + Podspec: thêm skparagraph headers

Phase 6B — Platform Context + Canvas Integration
  ├── [cpp/android] Inject PlatformContext vào HybridUIEngine tại JNI module init [BLOCKER #2]
  ├── [cpp/ios]    Inject PlatformContext vào HybridUIEngine tại TurboModule init [BLOCKER #2]
  ├── [js] CanvasRoot: thêm useCanvasRef + redraw() trigger sau markDirty [BLOCKER #1]
  ├── [js] CanvasRoot: useDrawCallback với (canvas, info) → drawTree(w, h)
  └── [test] Render cây đơn giản 1 BoxNode lên Canvas → canvas có tự update không?

Phase 6C — Custom Reconciler
  ├── [js] SkiaKitReconciler.ts với createSkiaKitHostConfig(requestRedraw) factory [BLOCKER #4]
  ├── [js] Fix prepareForCommit → return containerInfo [BLOCKER #3]
  ├── [js] resetAfterCommit → markDirty + requestRedraw [BLOCKER #1]
  ├── [js] getRootHostContext → { canvasId } để multi-CanvasRoot hoạt động [BLOCKER #4]
  ├── [js] CanvasRoot: tạo Reconciler instance riêng per CanvasRoot [BLOCKER #4]
  └── [test] Reconciler unit tests với mock uiEngine

Phase 6D — Migrate Box + Text
  ├── [RESOLVED ✅] Dual Yoga Tree: Hướng B — LayoutSubsystem là single source of truth.
  │     Sau calculateLayout(), layoutStore gọi uiEngine.syncLayoutResults(allLayouts)
  │     → RenderNode._cachedLayout được cập nhật → paint() không cần gọi Yoga API
  │     (chi tiết xem Section 8.2 — syncLayoutResults implementation)
  ├── [js] layoutStore.ts: thêm uiEngine.syncLayoutResults(allLayouts) sau updateLayoutSVs()
  ├── [js] Box.tsx: delegate sang createBoxNode (thay vì Skia JSX)
  ├── [js] Text.tsx: delegate sang createTextNode
  └── [test] Visual regression: Box + Text render giống cũ

Phase 6E — Image + ScrollView
  ├── [cpp] ImageNode.hpp — loadAsync với SkStreamAsset API đúng [BUG #9]
  ├── [cpp] ScrollNode.hpp — nhận offset qua updateScrollNodeOffset [BLOCKER #6]
  ├── [js] ScrollView: thay runOnJS bằng worklet → updateScrollNodeOffset + redraw [BLOCKER #6]
  ├── [js] Image.tsx migration
  └── [test] Scroll physics 120fps test

Phase 6F — Compound Components + Polish
  ├── Migrate Button, Card, ListTile, Input...
  ├── Thread safety audit (shared_mutex verified)
  ├── prepareUpdate diff optimization + benchmark
  └── Performance benchmarks: target 60fps Android / 120fps iOS
```

---

## 15. Platform Context Injection (Bổ sung)

`RNSkPlatformContext` là C++ object không thể truyền từ JS. `HybridUIEngine` phải nhận nó tại module initialization time — trước khi JS gọi bất kỳ API nào.

### 15.1. Android — JNI Init

```cpp
// android/src/main/cpp/OnLoad.cpp
extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  // Lấy PlatformContext từ RNSkia module đã load trước đó
  auto platformContext = RNSkia::RNSkManager::getPlatformContext();
  // Inject vào HybridUIEngine
  HybridUIEngine::sharedInstance()->initWithPlatformContext(platformContext);
  return JNI_VERSION_1_6;
}
```

### 15.2. iOS — TurboModule Init

```objc
// ios/SkiaKitModule.mm
- (void)initialize {
  auto platformContext = [RNSkia::RNSkManager getPlatformContext];
  margelo::nitro::skiakit::HybridUIEngine::sharedInstance()
    ->initWithPlatformContext(platformContext);
}
```

### 15.3. C++ Interface

```cpp
// HybridUIEngine.hpp
void initWithPlatformContext(std::shared_ptr<RNSkia::RNSkPlatformContext> ctx) {
  _renderSubsystem.initFontManager(ctx->createFontMgr());
  _platformContext = ctx;  // Lưu lại để ImageNode.loadAsync dùng
}
```
