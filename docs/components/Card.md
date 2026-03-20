# Card Component

## Mục đích
- Khối thông tin nổi bật, hỗ trợ 3 styles: elevated (bóng), filled (nền), outlined (viền).

## Flutter tương đương
- `Card`, `Card.filled`, `Card.outlined` (Material 3)

## Kiến trúc: Composition (Tái sử dụng Box)

> **Card KHÔNG tự vẽ Skia nguyên thủy.**
> Card = Wrapper cấu hình sẵn cho `<Box>` (elevation + borderRadius mặc định).

## TypeScript Interface

```ts
type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;          // default: 280
  height?: number;         // default: 160
  variant?: CardVariant;   // default: 'elevated' — hình dạng
  borderRadius?: number;   // default: 12
  backgroundColor?: string; // default: auto từ variant
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}
```

## Variants (SHAPE only)

### `elevated` (mặc định) — bóng đổ
Nền = surface, có shadow.
```tsx
<Card><Text text="Hello" /></Card>
```

### `filled` — nền đầy, không bóng
Nền = surfaceVariant, không shadow.
```tsx
<Card variant="filled"><Text text="Hello" /></Card>
```

### `outlined` — viền, không bóng
Nền = surface, viền = border.
```tsx
<Card variant="outlined"><Text text="Hello" /></Card>
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `width` | `number` | `280` | ❌ | Chiều rộng |
| `height` | `number` | `160` | ❌ | Chiều cao |
| `borderRadius` | `number` | `12` | ❌ | Bo góc |
| `backgroundColor` | `string` | `'white'` | ❌ | Màu nền |
| `elevation` | `number` | `4` | ❌ | Đổ bóng |
| `children` | `ReactNode` | — | ❌ | Nội dung bên trong |
| `onPress` | `() => void` | — | ❌ | Tap callback |

```tsx
import React from 'react';
import { Box } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit/hooks';

export const Card = React.memo(function Card({
  x = 0, y = 0,
  width = 280, height = 160,
  variant = 'elevated',
  borderRadius = 12,
  backgroundColor,      // undefined → auto từ variant
  children,
  onPress,
  onLongPress,
}: CardProps) {
  const theme = useTheme();
  const styles = resolveCardStyles(variant, backgroundColor, theme);

  return (
    <Box
      x={x} y={y}
      width={width} height={height}
      borderRadius={borderRadius}
      color={styles.background}
      elevation={styles.elevation}
      borderWidth={styles.borderWidth}
      borderColor={styles.borderColor}
      hitTestBehavior="deferToChild"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {children}
    </Box>
  );
});

function resolveCardStyles(variant: CardVariant, customBg: string | undefined, theme: ReturnType<typeof useTheme>) {
  const c = theme.colors;
  switch (variant) {
    case 'elevated':
      return { background: customBg ?? c.surface, elevation: 4, borderWidth: 0, borderColor: 'transparent' };
    case 'filled':
      return { background: customBg ?? c.surfaceVariant, elevation: 0, borderWidth: 0, borderColor: 'transparent' };
    case 'outlined':
      return { background: customBg ?? c.surface, elevation: 0, borderWidth: 1, borderColor: c.border };
    default:
      return { background: customBg ?? c.surface, elevation: 4, borderWidth: 0, borderColor: 'transparent' };
  }
}
```

## Cách dùng

### Cơ bản
```tsx
<CanvasRoot>
  <Card x={16} y={100} width={328} height={180} elevation={6}>
    <Image x={32} y={116} width={80} height={80} src={product.image} borderRadius={8} />
    <Text x={128} y={120} width={196} text={product.title} fontSize={16} fontWeight="bold" />
    <Text x={128} y={148} width={196} text={product.price} fontSize={14} color="green" />
    <Button x={128} y={170} text="Mua" />
  </Card>
</CanvasRoot>
```

### Card có thể bấm
```tsx
<Card x={16} y={100} width={328} height={80} onPress={() => navigateToDetail(item)}>
  <Text x={32} y={130} text={item.title} fontSize={16} />
</Card>
```

## Links
- Base: [Box.md](./Box.md)
- Store: [event-store.md](../store-design/event-store.md)
- Integration: [integration.md](../store-design/integration.md)
