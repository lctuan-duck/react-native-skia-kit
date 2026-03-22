# Radio Component

## Mục đích
- Cho phép chọn một giá trị trong nhóm lựa chọn.

## Flutter tương đương
- `Radio`, `RadioListTile`

## Kiến trúc: Composition (Tái sử dụng Box)

> **Radio KHÔNG vẽ Skia nguyên thủy.**
> Radio = `<Box>` tròn (outer ring) + `<Box>` tròn nhỏ hơn (inner dot khi selected).

## TypeScript Interface

```ts
interface RadioProps extends WidgetProps {
  x?: number;              // default: 0 — top-left X (không dùng cx)
  y?: number;              // default: 0 — top-left Y (không dùng cy)
  size?: number;           // default: 24
  selected?: boolean;      // default: false
  disabled?: boolean;      // default: false
  color?: string;          // default: theme.colors.primary
  onChange?: (selected: boolean) => void;
  onPress?: () => void;
  hitTestBehavior?: HitTestBehavior; // default: 'opaque'
  accessibilityLabel?: string;
  accessibilityRole?: string; // default: 'radio'
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X (thống nhất Flutter style) |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `size` | `number` | `24` | ❌ | Kích thước |
| `selected` | `boolean` | `false` | ❌ | Đang chọn |
| `disabled` | `boolean` | `false` | ❌ | Vô hiệu hóa |
| `color` | `string` | `theme.primary` | ❌ | Màu khi selected |
| `onChange` | `(selected: boolean) => void` | — | ❌ | Callback khi thay đổi |
| `onPress` | `() => void` | — | ❌ | Tap callback |

> **Note**: Đã chuyển từ `cx, cy` (tâm) sang `x, y` (top-left) để thống nhất Flutter convention. Tâm được tính tự động: `cx = x + size/2`, `cy = y + size/2`.

## Core Implementation (Composition + Store)

```tsx
import React from 'react';
import { Circle } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';

export const Radio = React.memo(function Radio({
  x = 0, y = 0,
  size = 24,
  selected = false,
  disabled = false,
  color,                  // undefined → theme.colors.primary
  onChange,
  onPress,
  accessibilityLabel,
}: RadioProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  const borderColor = disabled ? theme.colors.textDisabled : selected ? activeColor : theme.colors.outline;
  const dotColor = disabled ? theme.colors.textDisabled : activeColor;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!selected);
    onPress?.();
  };

  // === Hook thay thế boilerplate ===
  useWidget<{ selected: boolean; disabled: boolean }>({
    type: 'Radio',
    layout: { x, y, width: size, height: size },
    props: { selected, disabled },
  });

  // Box handles onPress via hitTestBehavior + onPress prop — no useHitTest needed

  return (
    <Box
      x={x} y={y}
      width={size} height={size}
      color="transparent"
      borderRadius={r}
      borderWidth={2}
      borderColor={borderColor}
      opacity={disabled ? 0.5 : 1}
      hitTestBehavior="opaque"
      onPress={handlePress}
    >
      {/* Inner dot (khi selected) — Circle vì cần tâm chính xác */}
      {selected && <Circle cx={cx} cy={cy} r={r * 0.4} color={dotColor} />}
    </Box>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<CanvasRoot>
  <Radio x={16} y={88} selected={gender === 'male'} onChange={() => setGender('male')} />
  <Text x={48} y={92} text="Nam" fontSize={16} />

  <Radio x={16} y={120} selected={gender === 'female'} onChange={() => setGender('female')} />
  <Text x={48} y={124} text="Nữ" fontSize={16} />
</CanvasRoot>
```

### Trong Card
```tsx
<Card x={16} y={100} width={328} height={120}>
  <Radio x={32} y={118} selected={plan === 'free'} onChange={() => setPlan('free')} />
  <Text x={64} y={122} text="Miễn phí" fontSize={14} />

  <Radio x={32} y={150} selected={plan === 'pro'} onChange={() => setPlan('pro')} />
  <Text x={64} y={154} text="Pro — 99k/tháng" fontSize={14} />
</Card>
```

## Events
| Event | Mô tả | Gesture Recognizer |
|-------|--------|-------------------|
| `onPress` | Tap vào radio | TapGestureRecognizer |
| `onChange` | Trạng thái selected thay đổi | — (gọi từ onPress) |

## Links
- Base: [Box.md](./Box.md)
- Store: [event-store.md](../store-design/event-store.md)
- Integration: [integration.md](../store-design/integration.md)
