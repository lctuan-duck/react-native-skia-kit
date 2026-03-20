# GestureDetector Component

## Mục đích
- Wrapper component để bắt gesture trên bất kỳ child nào.
- Tương đương đăng ký `useHitTest` nhưng dùng declaratively.

## Flutter tương đương
- `GestureDetector`, `InkWell`, `Listener`

## TypeScript Interface

```ts
interface GestureDetectorProps extends WidgetProps {
  x?: number;
  y?: number;
  width: number;           // REQUIRED
  height: number;          // REQUIRED
  onTap?: () => void;
  onLongPress?: () => void;
  onPanStart?: (e: GestureEvent) => void;
  onPanUpdate?: (e: GestureEvent) => void;
  onPanEnd?: (e: GestureEvent) => void;
  onDoubleTap?: () => void;
  hitTestBehavior?: HitTestBehavior; // default: 'deferToChild'
  children: React.ReactNode;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `width` | `number` | — | ✅ | Chiều rộng hit area |
| `height` | `number` | — | ✅ | Chiều cao hit area |
| `onTap` | `() => void` | — | ❌ | Tap callback |
| `onLongPress` | `() => void` | — | ❌ | Long press |
| `onPanStart` | `(e) => void` | — | ❌ | Pan start |
| `onPanUpdate` | `(e) => void` | — | ❌ | Pan update |
| `onPanEnd` | `(e) => void` | — | ❌ | Pan end |
| `onDoubleTap` | `() => void` | — | ❌ | Double tap |
| `hitTestBehavior` | `HitTestBehavior` | `'deferToChild'` | ❌ | Behavior |

## Core Implementation

```tsx
import React from 'react';
import { Group } from '@shopify/react-native-skia';
import { useWidget, useHitTest } from 'react-native-skia-kit/hooks';

export const GestureDetector = React.memo(function GestureDetector({
  x = 0, y = 0,
  width, height,
  onTap, onLongPress,
  onPanStart, onPanUpdate, onPanEnd,
  hitTestBehavior = 'deferToChild',
  children,
}: GestureDetectorProps) {
  const widgetId = useWidget({ type: 'GestureDetector', layout: { x, y, width, height } });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: {
      onPress: onTap,
      onLongPress,
      onPanStart,
      onPanUpdate,
      onPanEnd,
    },
    behavior: hitTestBehavior,
  });

  return <Group>{children}</Group>;
});
```

## Cách dùng

### Bọc element bất kỳ
```tsx
<GestureDetector x={16} y={100} width={200} height={200}
  onTap={() => console.log('tapped!')}
  onLongPress={() => console.log('long pressed!')}
>
  <Image x={16} y={100} width={200} height={200} src={photo} />
</GestureDetector>
```

### Pan/Drag
```tsx
<GestureDetector x={0} y={0} width={360} height={800}
  onPanUpdate={(e) => moveElement(e.x, e.y)}
  hitTestBehavior="translucent"
>
  <Box x={elementX} y={elementY} width={80} height={80} color="blue" borderRadius={12} />
</GestureDetector>
```

## So sánh: GestureDetector vs useHitTest

| | GestureDetector | useHitTest |
|--|-----------------|-----------|
| Style | Declarative (JSX) | Imperative (hook) |
| Khi nào dùng | Bọc ngoài element | Bên trong component |
| Flexibility | Medium | High |

## Links
- Hook: [useHitTest.md](../hooks/useHitTest.md)
- Store: [event-store.md](../store-design/event-store.md)
