# Draggable & DragTarget Components

## Mục đích
- **Draggable**: Cho phép kéo element trên canvas.
- **DragTarget**: Vùng nhận drop, detect khi Draggable được thả vào.

## Flutter tương đương
- `Draggable`, `DragTarget`, `LongPressDraggable`

## TypeScript Interface

```ts
interface DraggableProps<T = any> extends WidgetProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  data: T;               // REQUIRED — data truyền sang DragTarget
  axis?: 'horizontal' | 'vertical' | 'both'; // default: 'both'
  feedback?: React.ReactNode;       // widget hiển thị khi đang kéo
  childWhenDragging?: React.ReactNode; // widget thay thế vị trí gốc khi kéo
  onDragStarted?: () => void;
  onDragEnd?: (accepted: boolean) => void;
  children: React.ReactNode;
}

interface DragTargetProps<T = any> extends WidgetProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  onAccept?: (data: T) => void;
  onWillAccept?: (data: T) => boolean;
  builder: (isHovering: boolean) => React.ReactNode;
}
```

## Core Implementation

```tsx
import React from 'react';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { Group } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget, useHitTest } from 'react-native-skia-kit/hooks';

export const Draggable = React.memo(function Draggable<T>({
  x = 0, y = 0, width, height,
  data,
  axis = 'both',
  feedback,
  childWhenDragging,
  onDragStarted, onDragEnd,
  children,
}: DraggableProps<T>) {
  const isDragging = useSharedValue(false);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const widgetId = useWidget({ type: 'Draggable', layout: { x, y, width, height } });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: {
      onPanStart: () => {
        isDragging.value = true;
        dragX.value = 0;
        dragY.value = 0;
        onDragStarted?.();
      },
      onPanUpdate: (e) => {
        if (axis !== 'vertical') dragX.value += e.deltaX;
        if (axis !== 'horizontal') dragY.value += e.deltaY;
      },
      onPanEnd: () => {
        isDragging.value = false;
        // Check if dropped on DragTarget (qua eventStore)
        dragX.value = 0;
        dragY.value = 0;
      },
    },
    behavior: 'opaque',
  });

  return (
    <Group>
      {/* Original position — show childWhenDragging nếu đang kéo */}
      {isDragging.value && childWhenDragging ? childWhenDragging : children}

      {/* Dragging feedback — di chuyển theo ngón tay */}
      {isDragging.value && (
        <Group transform={[{ translateX: dragX.value }, { translateY: dragY.value }]}>
          {feedback ?? children}
        </Group>
      )}
    </Group>
  );
});

export const DragTarget = React.memo(function DragTarget<T>({
  x = 0, y = 0, width, height,
  onAccept,
  onWillAccept,
  builder,
}: DragTargetProps<T>) {
  const isHovering = useSharedValue(false);

  useWidget({ type: 'DragTarget', layout: { x, y, width, height } });

  // DragTarget lắng nghe eventStore cho drag events
  // Khi Draggable overlap → isHovering = true
  // Khi drop → onAccept(data)

  return (
    <Box x={x} y={y} width={width} height={height}>
      {builder(isHovering.value)}
    </Box>
  );
});
```

## Cách dùng

### Drag to reorder
```tsx
{items.map((item, i) => (
  <Draggable key={item.id} width={328} height={60} data={item}
    feedback={<Card width={328} height={60} elevation={8} opacity={0.8}>
      <Text text={item.name} />
    </Card>}
  >
    <Card width={328} height={60}>
      <Row padding={16} gap={12} crossAxisAlignment="center">
        <Icon name="grip" size={20} color={theme.colors.textDisabled} />
        <Text text={item.name} fontSize={16} />
      </Row>
    </Card>
  </Draggable>
))}
```

### Drag to trash
```tsx
<DragTarget x={280} y={700} width={64} height={64}
  onAccept={(item) => deleteItem(item.id)}
  builder={(hovering) => (
    <Box width={64} height={64} borderRadius={32}
      color={hovering ? theme.colors.error : theme.colors.surfaceVariant}
      flexDirection="column" justifyContent="center" alignItems="center"
    >
      <Icon name="trash" size={28} color={hovering ? theme.colors.onError : theme.colors.textDisabled} />
    </Box>
  )}
/>
```

## Links
- Gesture: [GestureDetector.md](./GestureDetector.md), [useHitTest.md](../hooks/useHitTest.md)
- Related: [Dismissible.md](./Dismissible.md)
