## Lưu ý về lưu trữ dữ liệu widget/layout/navigation
- Dùng Zustand store + Immer middleware để quản lý layoutMap, navigationStack, screenMap, stateMap.
- Khi unmount hoặc chuyển màn hình, cleanup hoặc cache dữ liệu đúng cách.
- Immer giúp truy xuất nhanh, cleanup hiệu quả, structural sharing tự động.

# Phase 10: Performance Optimization

## Checklist
- [x] Chỉ re-render widget khi layout, props hoặc animation thay đổi (smart re-render 3 tầng)
- [x] Load font và image trước khi render, tránh delay UI
- [x] Quản lý hitMap và Yoga Node hiệu quả, cleanup khi unmount
- [x] Tối ưu hóa draw calls, tránh vẽ thừa trên Canvas
- [x] Quản lý navigation stack, cache UI và state từng màn hình
- [x] Chỉ render màn hình active, giữ state khi quay lại
- [x] Tối ưu hóa animation cho nhiều widget đồng thời
- [x] Đảm bảo đồng nhất UI trên Android/iOS (font, layout, render)
- [x] Kiểm tra memory leak định kỳ, giải phóng tài nguyên không dùng
- [x] Triển khai Sliver/Lazy rendering cho ListView lớn

## Smart Re-render (3 tầng)
Tương đương `markNeedsPaint` / `markNeedsLayout` của Flutter:

### Tầng 1: Zustand Selector
```ts
// Chỉ re-render khi layout CỦA WIDGET NÀY thay đổi
const layout = useLayoutStore((state) => state.layoutMap.get(widgetId));
```

### Tầng 2: React.memo + custom compare
```ts
export const SkiaBox = React.memo(function SkiaBox(props) {
  // ...
}, (prev, next) => {
  return prev.color === next.color && prev.widgetId === next.widgetId;
});
```

### Tầng 3: useDerivedValue cho Animation
```ts
const derivedOpacity = useDerivedValue(() => opacity.value);
```

## Dirty Checking cho Layout
```ts
// Khi props thay đổi → đánh dấu dirty
useLayoutStore.getState().markNeedsLayout(widgetId);

// Batch recalculate chỉ cho dirty widgets
useLayoutStore.getState().recalculateLayout(yogaEngine);
```

## Immer cho tất cả Store
- Dùng Immer middleware để tránh `new Map()` copy toàn bộ mỗi lần update.
- Immer tạo structural sharing, chỉ copy phần thay đổi.
- Apply cho widgetStore, layoutStore, eventStore, navStore, portalStore, themeStore.

```ts
import { enableMapSet } from 'immer';
enableMapSet();

// Mỗi store dùng immer middleware
export const useLayoutStore = create(immer((set) => ({ ... })));
```

## Sliver/Lazy Rendering cho ListView
Viewport-based rendering: chỉ render items trong viewport + buffer zone.

```
  ┌─────────────────┐
  │   Buffer (~5)    │ ← Render trước
  ├─────────────────┤
  │   Viewport      │ ← Phần nhìn thấy
  ├─────────────────┤
  │   Buffer (~5)    │ ← Render trước
  └─────────────────┘
  Items ngoài buffer → KHÔNG render
```

### Thuật toán
```ts
class VirtualizedListEngine {
  private scrollOffset = 0;
  private viewportHeight: number;
  private itemHeight: number;
  private bufferCount = 5;

  getVisibleRange(): { startIndex: number; endIndex: number } {
    const startIndex = Math.max(0,
      Math.floor(this.scrollOffset / this.itemHeight) - this.bufferCount
    );
    const endIndex = Math.min(this.totalItems - 1,
      Math.ceil((this.scrollOffset + this.viewportHeight) / this.itemHeight) + this.bufferCount
    );
    return { startIndex, endIndex };
  }

  onScroll(newOffset: number) {
    const oldRange = this.getVisibleRange();
    this.scrollOffset = newOffset;
    const newRange = this.getVisibleRange();
    // Chỉ trigger re-render nếu range thay đổi
  }
}
```

### Dynamic height support
- Sử dụng estimated height + height cache:
```ts
heightCache: Map<string, number> = new Map(); // key: itemId, value: actual height
estimatedHeight = 48; // mặc định
```

## Scroll Physics
Xem chi tiết tại [special-cases.md](../store-design/special-cases.md#6-scroll-physics-store).

- **ClampingScrollPhysics** (Android): dừng tại giới hạn, friction deceleration
- **BouncingScrollPhysics** (iOS): rubber band overscroll, spring bounce back
- Tích hợp với Gesture Arena (VerticalDragRecognizer) cho ScrollView/ListView

## Steps
1. Dùng Immer middleware cho tất cả store
2. Triển khai smart re-render 3 tầng
3. Triển khai dirty checking cho layout
4. Load font và image trước khi render
5. Triển khai sliver/lazy rendering cho ListView
6. Triển khai scroll physics (Clamping + Bouncing)
7. Quản lý navigation stack, chỉ render màn hình active
8. Định kỳ kiểm tra memory leak, giải phóng tài nguyên

## Hướng dẫn sử dụng profiling tools
- React Native Performance Monitor: FPS, JS thread, UI thread
- Skia Debugger: draw calls, memory usage
- Yoga Debug/Log: layout tree, memory leak
- Chrome DevTools hoặc Flipper: memory, network, UI update

## Nguồn tham khảo
- [React Native Skia Performance](https://shopify.github.io/react-native-skia/docs/performance/)
- [Flutter Performance](https://docs.flutter.dev/perf/rendering)
- [Yoga Memory Management](https://github.com/facebook/yoga/issues/1119)
- [Flutter Scroll Physics](https://api.flutter.dev/flutter/widgets/ScrollPhysics-class.html)
