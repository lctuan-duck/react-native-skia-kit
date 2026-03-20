# Badge Component

## Mục đích
- Hiển thị notification count hoặc indicator dot.
- Hỗ trợ 2 variants: standard (số) và dot (chấm nhỏ).

## Flutter tương đương
- `Badge`, `Badge.count` (Material 3)

## Kiến trúc: Composition (Tái sử dụng Box + Text)

> **Badge KHÔNG vẽ Skia nguyên thủy.**
> Badge = `<Box>` tròn (borderRadius = size/2) + `<Text>` căn giữa.

## TypeScript Interface

```ts
type BadgeVariant = 'standard' | 'dot';

interface BadgeProps extends WidgetProps {
  x?: number;
  y?: number;
  variant?: BadgeVariant;  // default: 'standard'
  value?: number;          // default: 1 (chỉ dùng cho standard)
  size?: number;           // default: 20 (standard), 10 (dot)
  color?: string;          // default: theme.colors.error
  textColor?: string;      // default: theme.colors.onError
  onPress?: () => void;
}
```

## Variants (SHAPE only)

### `standard` (mặc định) — hiển thị số
```tsx
<Badge x={34} y={94} value={5} />
```

### `dot` — chấm nhỏ (không số)
```tsx
<Badge variant="dot" x={34} y={94} />
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X (thống nhất Flutter) |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `value` | `number` | `1` | ❌ | Số hiển thị (max 99+) |
| `size` | `number` | `20` | ❌ | Kích thước badge |
| `color` | `string` | `theme.error` | ❌ | Màu nền |
| `textColor` | `string` | `'white'` | ❌ | Màu text |
| `onPress` | `() => void` | — | ❌ | Tap callback |

> **Note**: Đã chuyển từ `cx, cy` (tâm) sang `x, y` (top-left) để thống nhất Flutter convention.

## Core Implementation (Composition + Store)

```tsx
import React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';

export const Badge = React.memo(function Badge({
  x = 0, y = 0,
  variant = 'standard',
  value = 1,
  size,
  color,
  textColor,
  onPress,
}: BadgeProps) {
  const theme = useTheme();
  const bgColor = color ?? theme.colors.error;
  const fgColor = textColor ?? theme.colors.onError;

  // Dot variant: nhỏ, không text
  if (variant === 'dot') {
    const dotSize = size ?? 10;
    return (
      <Box
        x={x} y={y}
        width={dotSize} height={dotSize}
        borderRadius={dotSize / 2}
        color={bgColor}
        borderWidth={2} borderColor={theme.colors.surface}
      />
    );
  }

  // Standard variant: số
  const badgeSize = size ?? 20;
  const label = String(value > 99 ? '99+' : value);

  useWidget<{ value: number }>({ type: 'Badge', layout: { x, y, width: badgeSize, height: badgeSize }, props: { value } });

  return (
    <Box
      x={x} y={y}
      width={badgeSize} height={badgeSize}
      borderRadius={badgeSize / 2}
      color={bgColor}
      hitTestBehavior={onPress ? 'opaque' : 'deferToChild'}
      onPress={onPress}
    >
      <Text
        x={x}
        y={y + badgeSize / 2 - (badgeSize * 0.55) / 2}
        width={badgeSize}
        text={label}
        fontSize={badgeSize * 0.55}
        color={fgColor}
        textAlign="center"
        fontWeight="bold"
      />
    </Box>
  );
});
```

## Cách dùng

### Trên Icon
```tsx
<CanvasRoot>
  <Icon x={16} y={100} name="bell" size={28} color={theme.colors.textBody} />
  {/* Badge overlay góc trên phải của Icon */}
  <Badge x={34} y={94} value={5} size={16} />
</CanvasRoot>
```

### Trên Avatar
```tsx
<Avatar x={16} y={100} size={48} src={userAvatar} />
<Badge x={52} y={98} value={3} size={18} />
```

### Trong navigation bar
```tsx
<Box x={0} y={760} width={360} height={56} color="white" elevation={4}>
  <Icon x={60} y={776} name="home" size={24} />
  <Icon x={168} y={776} name="bell" size={24} />
  <Badge x={184} y={772} value={12} size={16} />
  <Icon x={276} y={776} name="user" size={24} />
</Box>
```

## Links
- Base: [Box.md](./Box.md), [Text.md](./Text.md)
- Related: [Avatar.md](./Avatar.md), [Icon.md](./Icon.md)
- Store: [widget-store.md](../store-design/widget-store.md)
