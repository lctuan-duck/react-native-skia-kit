# Dismissible Component

## Mục đích
- Cho phép swipe child sang trái/phải để dismiss (xóa, archive...).
- Hiển thị background action phía sau khi swipe.

## Flutter tương đương
- `Dismissible`

## TypeScript Interface

```ts
interface DismissibleProps extends WidgetProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  direction?: 'horizontal' | 'startToEnd' | 'endToStart'; // default: 'horizontal'
  dismissThreshold?: number;  // default: 0.4 (40% width)
  background?: React.ReactNode;        // hiện khi swipe phải
  secondaryBackground?: React.ReactNode; // hiện khi swipe trái
  onDismissed?: (direction: 'left' | 'right') => void;
  confirmDismiss?: (direction: 'left' | 'right') => boolean | Promise<boolean>;
  children: React.ReactNode;
}
```

## Core Implementation

```tsx
import React from 'react';
import { useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Group } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget, useHitTest } from 'react-native-skia-kit/hooks';

export const Dismissible = React.memo(function Dismissible({
  x = 0, y = 0, width, height,
  direction = 'horizontal',
  dismissThreshold = 0.4,
  background,
  secondaryBackground,
  onDismissed,
  confirmDismiss,
  children,
}: DismissibleProps) {
  const offsetX = useSharedValue(0);
  const widgetId = useWidget({ type: 'Dismissible', layout: { x, y, width, height } });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: {
      onPanUpdate: (e) => {
        const canSwipeRight = direction !== 'endToStart';
        const canSwipeLeft = direction !== 'startToEnd';
        if (e.deltaX > 0 && canSwipeRight) offsetX.value += e.deltaX;
        if (e.deltaX < 0 && canSwipeLeft) offsetX.value += e.deltaX;
      },
      onPanEnd: async () => {
        const threshold = width * dismissThreshold;
        const dir = offsetX.value > 0 ? 'right' : 'left';

        if (Math.abs(offsetX.value) > threshold) {
          // Check confirm
          const confirmed = confirmDismiss ? await confirmDismiss(dir) : true;
          if (confirmed) {
            offsetX.value = withTiming(dir === 'right' ? width : -width, { duration: 200 });
            runOnJS(onDismissed)?.(dir);
          } else {
            offsetX.value = withSpring(0);
          }
        } else {
          offsetX.value = withSpring(0);
        }
      },
    },
    behavior: 'opaque',
  });

  return (
    <Group>
      {/* Background — hiện ra khi swipe */}
      {offsetX.value > 0 && background && (
        <Box x={x} y={y} width={width} height={height}>{background}</Box>
      )}
      {offsetX.value < 0 && secondaryBackground && (
        <Box x={x} y={y} width={width} height={height}>{secondaryBackground}</Box>
      )}

      {/* Content — di chuyển theo swipe */}
      <Group transform={[{ translateX: offsetX.value }]}>
        {children}
      </Group>
    </Group>
  );
});
```

## Cách dùng

### Swipe to delete
```tsx
{items.map((item, i) => (
  <Dismissible key={item.id} width={360} height={72}
    direction="endToStart"
    background={
      <Row width={360} height={72} mainAxisAlignment="end" padding={[0, 16, 0, 0]}>
        <Icon name="trash" size={24} color="white" />
      </Row>
    }
    onDismissed={() => deleteItem(item.id)}
    confirmDismiss={() => confirm('Xóa item này?')}
  >
    <Card width={360} height={72}>
      <Row padding={16} crossAxisAlignment="center" gap={12}>
        <Avatar size={40} src={item.avatar} />
        <Text text={item.name} fontSize={16} />
      </Row>
    </Card>
  </Dismissible>
))}
```

## Links
- Gesture: [GestureDetector.md](./GestureDetector.md), [useHitTest.md](../hooks/useHitTest.md)
- Related: [ScrollView.md](./ScrollView.md)
