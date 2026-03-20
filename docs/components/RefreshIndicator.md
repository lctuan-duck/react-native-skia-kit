# RefreshIndicator Component

## Mục đích
- Pull-to-refresh cho ScrollView/ListView — kéo xuống để reload dữ liệu.
- Hiển thị spinner animation khi đang refresh.

## Flutter tương đương
- `RefreshIndicator`, `CupertinoSliverRefreshControl`

## TypeScript Interface

```ts
interface RefreshIndicatorProps extends WidgetProps {
  children: React.ReactNode;  // REQUIRED — ScrollView bên trong
  onRefresh: () => Promise<void>; // REQUIRED — async callback
  color?: string;             // default: theme.colors.primary
  backgroundColor?: string;   // default: theme.colors.surface
  displacement?: number;      // default: 40 — khoảng cách kéo để trigger
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `children` | `ReactNode` | — | ✅ | ScrollView content |
| `onRefresh` | `() => Promise<void>` | — | ✅ | Refresh callback |
| `color` | `string` | `theme.primary` | ❌ | Màu spinner |
| `backgroundColor` | `string` | `theme.surface` | ❌ | Nền indicator |
| `displacement` | `number` | `40` | ❌ | Kéo bao xa để trigger |

## Core Implementation

```tsx
import React, { useState, useCallback } from 'react';
import { Group, Circle } from '@shopify/react-native-skia';
import { useAnimation } from '../hooks/useAnimation';
import { useTheme } from '../hooks/useTheme';

export const RefreshIndicator = React.memo(function RefreshIndicator({
  children,
  onRefresh,
  color,
  backgroundColor,
  displacement = 40,
}: RefreshIndicatorProps) {
  const theme = useTheme();
  const spinnerColor = color ?? theme.colors.primary;
  const bgColor = backgroundColor ?? theme.colors.surface;
  const [refreshing, setRefreshing] = useState(false);
  const pullOffset = useAnimation(0);
  const spinAnim = useAnimation(0);

  const handlePanUpdate = useCallback((e: GestureEvent) => {
    if (refreshing) return;
    const dy = Math.max(0, Math.min(e.translationY, displacement * 2));
    pullOffset.animateTo(dy / (displacement * 2), { duration: 0 });
  }, [refreshing]);

  const handlePanEnd = useCallback(async () => {
    if (pullOffset.value.value >= 0.5 && !refreshing) {
      setRefreshing(true);
      spinAnim.repeat({ duration: 800, reverse: false });
      try {
        await onRefresh();
      } finally {
        spinAnim.stop();
        setRefreshing(false);
        pullOffset.reverse({ duration: 200 });
      }
    } else {
      pullOffset.reverse({ duration: 200 });
    }
  }, [refreshing, onRefresh]);

  return (
    <Group>
      {/* Spinner indicator */}
      {pullOffset.value.value > 0 && (
        <Group>
          <Circle
            cx={180} cy={displacement / 2}
            r={14} color={bgColor}
          />
          <Progress
            variant="circular"
            x={166} y={displacement / 2 - 14}
            size={28}
            color={spinnerColor}
            value={refreshing ? undefined : pullOffset.value.value}
          />
        </Group>
      )}

      {/* Content — offset khi kéo */}
      <Group transform={[{ translateY: pullOffset.value.value * displacement }]}>
        {children}
      </Group>
    </Group>
  );
});
```

## Cách dùng

```tsx
<RefreshIndicator onRefresh={async () => {
  await fetchData();
}}>
  <ScrollView height={700}>
    {items.map(item => (
      <ListTile key={item.id} title={item.title} />
    ))}
  </ScrollView>
</RefreshIndicator>
```

## Links
- Base: [Progress.md](./Progress.md), [ScrollView.md](./ScrollView.md)
- Animation: [useAnimation.md](../hooks/useAnimation.md)
