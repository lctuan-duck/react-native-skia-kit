# useHitTest Hook

## Mục đích
- **Gom logic đăng ký event/hit test** (eventStore) vào 1 hook duy nhất.
- Tự động đăng ký hit area + callbacks khi mount, cleanup khi unmount.
- Chỉ đăng ký khi có ít nhất 1 callback (onPress, onLongPress, onPanStart...).

## Flutter tương đương
- `GestureDetector`, `RawGestureDetector`, `Listener`

## TypeScript Interface

```ts
interface HitRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface EventCallbacks {
  onPress?: () => void;
  onLongPress?: () => void;
  onPanStart?: (e: GestureEvent) => void;
  onPanUpdate?: (e: GestureEvent) => void;
  onPanEnd?: (e: GestureEvent) => void;
}

interface UseHitTestOptions {
  rect: HitRect;
  callbacks: EventCallbacks;
  behavior?: HitTestBehavior;   // default: 'deferToChild'
  zIndex?: number;              // default: 0
  canvasId?: string;            // default: 'main'
}

function useHitTest(widgetId: string, options: UseHitTestOptions): void;
```

## Internal Implementation

```ts
import { useEffect } from 'react';
import { useEventStore } from '../store/eventStore';

export function useHitTest(
  widgetId: string,
  { rect, callbacks, behavior = 'deferToChild', zIndex = 0, canvasId = 'main' }: UseHitTestOptions
): void {
  useEffect(() => {
    // Chỉ đăng ký khi có ít nhất 1 callback
    const hasCallbacks = callbacks.onPress || callbacks.onLongPress ||
      callbacks.onPanStart || callbacks.onPanUpdate || callbacks.onPanEnd;
    if (!hasCallbacks) return;

    useEventStore.getState().registerHit(canvasId, widgetId, {
      widgetId,
      parentId: null,
      rect,
      zIndex,
      hitTestBehavior: behavior,
      callbacks,
    });

    return () => {
      useEventStore.getState().unregisterHit(canvasId, widgetId);
    };
  }, [widgetId]);

  // Update hit rect khi position/size thay đổi
  useEffect(() => {
    const hasCallbacks = callbacks.onPress || callbacks.onLongPress ||
      callbacks.onPanStart || callbacks.onPanUpdate || callbacks.onPanEnd;
    if (!hasCallbacks) return;

    useEventStore.getState().registerHit(canvasId, widgetId, {
      widgetId,
      parentId: null,
      rect,
      zIndex,
      hitTestBehavior: behavior,
      callbacks,
    });
  }, [rect.left, rect.top, rect.width, rect.height]);
}
```

## Cách dùng

### Tap event (Button, Checkbox, Radio...)
```tsx
const widgetId = useWidget({ type: 'Button', layout: { x, y, width, height } });
useHitTest(widgetId, {
  rect: { left: x, top: y, width, height },
  callbacks: { onPress: handlePress, onLongPress: handleLongPress },
  behavior: 'opaque',
});
```

### Pan/Drag event (Slider)
```tsx
const widgetId = useWidget({ type: 'Slider', layout: { x, y, width, height: totalHeight } });
useHitTest(widgetId, {
  rect: { left: x, top: y, width, height: totalHeight },
  callbacks: { onPanUpdate: handleDrag },
  behavior: 'opaque',
});
```

### Translucent (Overlay — nhận event VÀ truyền tiếp)
```tsx
const widgetId = useWidget({ type: 'Overlay', layout: { x: 0, y: 0, width: w, height: h } });
useHitTest(widgetId, {
  rect: { left: 0, top: 0, width: w, height: h },
  callbacks: { onPress: closeOverlay },
  behavior: 'translucent',
  zIndex: 90,
});
```

### Conditional — không đăng ký nếu không có callback
```tsx
// useHitTest tự bỏ qua nếu không có callback nào
useHitTest(widgetId, {
  rect: { left: x, top: y, width, height },
  callbacks: { onPress }, // nếu onPress undefined → không đăng ký
});
```

## HitTestBehavior cheat sheet

| Behavior | Mô tả | Dùng cho |
|----------|--------|---------|
| `opaque` | Chặn event, không truyền xuống | Button, Checkbox, Slider |
| `translucent` | Nhận event VÀ truyền tiếp | Overlay, backdrop |
| `deferToChild` | Chỉ nhận nếu child nhận | Box, Card, container |

## Links
- Store: [event-store.md](../store-design/event-store.md)
- Used with: [useWidget.md](./useWidget.md)
- Integration: [integration.md](../store-design/integration.md)
