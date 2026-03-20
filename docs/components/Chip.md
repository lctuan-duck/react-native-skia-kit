# Chip Component

## Mục đích
- Tag/label nhỏ hiển thị lựa chọn, trạng thái.
- Hỗ trợ 2 variants: filled (nền đặc) và outlined (viền).

## Flutter tương đương
- `Chip`, `FilterChip`, `ChoiceChip`, `InputChip`

## Kiến trúc: Composition (Tái sử dụng Box + Text)

> **Chip KHÔNG vẽ Skia nguyên thủy.**
> Chip = `<Box>` (nền, viền) + `<Text>` (nhãn).

## TypeScript Interface

```ts
type ChipVariant = 'filled' | 'outlined';

interface ChipProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;          // default: 80
  height?: number;         // default: 32
  label: string;
  selected?: boolean;      // default: false
  variant?: ChipVariant;   // default: 'filled' — hình dạng
  color?: string;          // default: theme.colors.primary — màu chủ đạo
  borderRadius?: number;   // default: 16
  onPress?: () => void;
}
```

## Variants (SHAPE only)

### `filled` (mặc định) — nền đặc khi selected
Selected: nền = color. Unselected: nền = surfaceVariant.
```tsx
<Chip label="React" selected />
<Chip label="Flutter" />
```

### `outlined` — viền khi selected
Selected: viền = color, nền transparent. Unselected: viền = border.
```tsx
<Chip variant="outlined" label="Lọc" selected />
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `width` | `number` | `80` | ❌ | Chiều rộng |
| `height` | `number` | `32` | ❌ | Chiều cao |
| `label` | `string` | — | ✅ | Text hiển thị |
| `selected` | `boolean` | `false` | ❌ | Đang chọn |
| `color` | `string` | `theme.primary` | ❌ | Màu chủ đạo |
| `borderRadius` | `number` | `16` | ❌ | Bo góc |
| `onPress` | `() => void` | — | ❌ | Tap callback |

## Core Implementation

```tsx
import React from 'react';
import { Box, Text } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit/hooks';

export const Chip = React.memo(function Chip({
  x = 0, y = 0,
  width = 80, height = 32,
  label,
  selected = false,
  variant = 'filled',
  color,                  // undefined → theme.colors.primary
  borderRadius = 16,
  onPress,
}: ChipProps) {
  const theme = useTheme();
  const chipColor = color ?? theme.colors.primary;
  const styles = resolveChipStyles(variant, chipColor, selected, theme);

  return (
    <Box
      x={x} y={y}
      width={width} height={height}
      borderRadius={borderRadius}
      color={styles.background}
      borderWidth={styles.borderWidth}
      borderColor={styles.borderColor}
      hitTestBehavior="opaque"
      onPress={onPress}
    >
      <Text
        x={x + 8}
        y={y + (height / 2) - 6.5}
        width={width - 16}
        text={label}
        fontSize={13}
        color={styles.textColor}
        textAlign="center"
      />
    </Box>
  );
});

function resolveChipStyles(variant: ChipVariant, chipColor: string, selected: boolean, theme: any) {
  const c = theme.colors;
  if (variant === 'outlined') {
    return {
      background: 'transparent',
      borderWidth: 1,
      borderColor: selected ? chipColor : c.border,
      textColor: selected ? chipColor : c.textSecondary,
    };
  }
  // filled
  return {
    background: selected ? chipColor : c.surfaceVariant,
    borderWidth: 0,
    borderColor: 'transparent',
    textColor: selected ? contrastColor(chipColor) : c.textBody,
  };
}
```

## Cách dùng

```tsx
<CanvasRoot>
  <Chip x={16} y={100} label="React" selected={true} onPress={() => {}} />
  <Chip x={104} y={100} label="Flutter" selected={false} onPress={() => {}} />
  <Chip x={192} y={100} label="Skia" selected={false} onPress={() => {}} />
</CanvasRoot>
```

## Links
- Base: [Box.md](./Box.md), [Text.md](./Text.md)
- Store: [event-store.md](../store-design/event-store.md)
