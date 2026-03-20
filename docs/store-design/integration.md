# Store Integration Guide

## Mục đích
- Hướng dẫn tích hợp các store (widget, layout, nav, event) vào component base.
- Đảm bảo đồng bộ, tường minh, dễ mở rộng, giống Flutter.

> **Khuyến nghị**: Dùng hooks [`useWidget`](../hooks/useWidget.md) và [`useHitTest`](../hooks/useHitTest.md) thay vì gọi store trực tiếp. Hooks đã đóng gói toàn bộ logic bên dưới.

## Cách tích hợp (dùng Hooks — khuyến nghị)

```tsx
// 1. Đăng ký widget + layout (1 dòng)
const widgetId = useWidget({ type: 'MyComponent', layout: { x, y, width, height } });

// 2. Đăng ký hit test — chỉ khi cần event (1 dòng)
useHitTest(widgetId, { rect: { left: x, top: y, width, height }, callbacks: { onPress }, behavior: 'opaque' });
```

## Chi tiết nội bộ (Hooks làm gì bên dưới)
1. Mỗi component base (Box, Text, Button...) khi render:
   - Tự tạo widgetId (uuid) qua `useWidgetId()`.
   - Đăng ký widget vào widgetStore.
   - Đăng ký layout vào layoutStore.
   - Đăng ký vùng hit vào eventStore (hitMap) **kèm HitTestBehavior**.
   - Nếu thuộc nav/canvas, đăng ký vào navStore.
2. Khi unmount:
   - Cleanup widgetId khỏi widgetStore, layoutStore, eventStore, navStore.
3. Khi có sự kiện touch/gesture:
   - Lấy hitMap của canvas/nav hiện tại từ eventStore.
   - Thu thập tất cả widget tại (x, y), sắp xếp theo zIndex.
   - Áp dụng HitTestBehavior (opaque/translucent/deferToChild).
   - Chuyển event cho Gesture Arena nếu có nhiều recognizer.
4. Khi chuyển nav/màn hình:
   - Lấy navMap từ navStore, restore state, layout, widget tree.
   - Nếu dùng Router, gọi RouterDelegate.

## Ví dụ tích hợp component base
```ts
import React, { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWidgetStore } from '../store/widgetStore';
import { useLayoutStore } from '../store/layoutStore';
import { useEventStore } from '../store/eventStore';

function useWidgetId() {
  const idRef = useRef<string>();
  if (!idRef.current) idRef.current = uuidv4();
  return idRef.current;
}

// Component base sử dụng đầy đủ store
function BaseComponent({
  type,
  canvasId = 'main',
  hitTestBehavior = 'deferToChild',
  onPress,
  onLongPress,
  onPanStart,
  onPanUpdate,
  onPanEnd,
  ...props
}) {
  const widgetId = useWidgetId();

  // Zustand selector: chỉ re-render khi layout của widget này thay đổi
  const layout = useLayoutStore((state) => state.layoutMap.get(widgetId));

  useEffect(() => {
    // Đăng ký widget
    useWidgetStore.getState().registerWidget({
      id: widgetId,
      type,
      props,
      state: {},
      parentId: null,
      children: []
    });

    // Đăng ký hit với HitTestBehavior
    if (onPress || onLongPress || onPanStart) {
      useEventStore.getState().registerHit(canvasId, widgetId, {
        widgetId,
        parentId: null,
        rect: {
          left: layout?.x || 0,
          top: layout?.y || 0,
          width: layout?.width || 0,
          height: layout?.height || 0
        },
        zIndex: props.zIndex || 0,
        hitTestBehavior,
        callbacks: { onPress, onLongPress, onPanStart, onPanUpdate, onPanEnd }
      });
    }

    return () => {
      useWidgetStore.getState().unregisterWidget(widgetId);
      useLayoutStore.getState().removeLayout(widgetId);
      useEventStore.getState().unregisterHit(canvasId, widgetId);
    };
  }, [widgetId]);

  // Update hit rect khi layout thay đổi
  useEffect(() => {
    if (layout && (onPress || onLongPress || onPanStart)) {
      useEventStore.getState().registerHit(canvasId, widgetId, {
        widgetId,
        parentId: null,
        rect: { left: layout.x, top: layout.y, width: layout.width, height: layout.height },
        zIndex: props.zIndex || 0,
        hitTestBehavior,
        callbacks: { onPress, onLongPress, onPanStart, onPanUpdate, onPanEnd }
      });
    }
  }, [layout]);

  return layout; // Component con sẽ dùng layout để vẽ Skia
}
```

## Sử dụng React.memo cho Smart Re-render
```ts
export const SkiaBox = React.memo(function SkiaBox(props) {
  const layout = useLayoutStore((state) => state.layoutMap.get(props.widgetId));
  if (!layout) return null;
  return <Rect x={layout.x} y={layout.y} width={layout.width} height={layout.height} color={props.color} />;
}, (prev, next) => {
  return prev.color === next.color
    && prev.widgetId === next.widgetId
    && prev.borderRadius === next.borderRadius;
});
```

## HitTestBehavior mặc định theo component

| Component | HitTestBehavior mặc định |
|-----------|-------------------------|
| Box, Card, Image | `deferToChild` |
| Button, Checkbox, Switch, Radio | `opaque` |
| Overlay, Modal background | `translucent` |
| ScrollView, ListView | `deferToChild` + gesture recognizer |
| Slider | `opaque` + PanGestureRecognizer |

## Định hướng
- Đảm bảo component có thể xử lý event, thao tác, lifecycle, restore state như Flutter.
- HitTestBehavior giúp kiểm soát event bubbling chính xác.
- Gesture Arena giải quyết xung đột gesture tự động.
- Dễ mở rộng, cleanup, đồng bộ giữa các store.
