# Checkbox Component

## Mục đích
- Cho phép chọn/bỏ chọn trạng thái boolean.

## Flutter tương đương
- `Checkbox`, `CheckboxListTile`

## Kiến trúc: Composition (Tái sử dụng Box + Icon)

> **Checkbox KHÔNG vẽ Skia nguyên thủy.**
> Checkbox = `<Box>` (nền vuông bo góc) + `<Icon>` (checkmark khi selected).

## TypeScript Interface

```ts
interface CheckboxProps extends WidgetProps {
  x?: number;              // default: 0
  y?: number;              // default: 0
  size?: number;           // default: 24
  checked?: boolean;       // default: false
  disabled?: boolean;      // default: false
  color?: string;          // default: theme.colors.primary
  onChange?: (checked: boolean) => void;
  onPress?: () => void;
  hitTestBehavior?: HitTestBehavior; // default: 'opaque'
  accessibilityLabel?: string;
  accessibilityRole?: string; // default: 'checkbox'
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `size` | `number` | `24` | ❌ | Kích thước |
| `checked` | `boolean` | `false` | ❌ | Trạng thái chọn |
| `disabled` | `boolean` | `false` | ❌ | Vô hiệu hóa |
| `color` | `string` | `theme.primary` | ❌ | Màu khi checked |
| `onChange` | `(checked: boolean) => void` | — | ❌ | Callback khi thay đổi |
| `onPress` | `() => void` | — | ❌ | Tap callback |
| `accessibilityLabel` | `string` | — | ❌ | Screen reader label |

## Core Implementation (Composition + Store)

```tsx
import React from 'react';
import { Path } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';

export const Checkbox = React.memo(function Checkbox({
  x = 0, y = 0,
  size = 24,
  checked = false,
  disabled = false,
  color,                  // undefined → theme.colors.primary
  onChange,
  onPress,
  accessibilityLabel,
}: CheckboxProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const borderColor = disabled ? theme.colors.textDisabled : checked ? activeColor : theme.colors.outline;
  const bgColor = checked ? (disabled ? theme.colors.textDisabled : activeColor) : 'transparent';
  const checkPath = `M${x + size * 0.2} ${y + size * 0.5} l${size * 0.25} ${size * 0.25} l${size * 0.35} -${size * 0.35}`;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!checked);
    onPress?.();
  };

  // === Hook thay thế boilerplate ===
  useWidget<{ checked: boolean; disabled: boolean }>({
    type: 'Checkbox',
    layout: { x, y, width: size, height: size },
    props: { checked, disabled },
  });

  // Box handles onPress via hitTestBehavior + onPress prop — no useHitTest needed

  return (
    <Box
      x={x} y={y}
      width={size} height={size}
      borderRadius={4}
      color={bgColor}
      borderWidth={2}
      borderColor={borderColor}
      opacity={disabled ? 0.5 : 1}
      hitTestBehavior="opaque"
      onPress={handlePress}
    >
      {/* Checkmark — dùng Path vì Box không vẽ được đường cong */}
      {checked && (
        <Path
          path={checkPath}
          color="white"
          style="stroke"
          strokeWidth={2.5}
          strokeCap="round"
          strokeJoin="round"
        />
      )}
    </Box>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<CanvasRoot>
  <Checkbox x={16} y={100} checked={agree} onChange={setAgree} />
  <Text x={48} y={104} text="Tôi đồng ý với điều khoản" fontSize={14} />
</CanvasRoot>
```

### Disabled
```tsx
<Checkbox x={16} y={140} checked={true} disabled />
<Text x={48} y={144} text="Mục đã chọn (disabled)" fontSize={14} color={theme.colors.textDisabled} />
```

### Trong Card
```tsx
<Card x={16} y={100} width={328} height={60}>
  <Checkbox x={32} y={118} checked={selected} onChange={setSelected} />
  <Text x={64} y={122} text="Gửi thông báo email" fontSize={14} />
</Card>
```

## Events
| Event | Mô tả | Gesture Recognizer |
|-------|--------|-------------------|
| `onPress` | Tap vào checkbox | TapGestureRecognizer |
| `onChange` | Trạng thái checked thay đổi | — (gọi từ onPress) |

## Links
- Base: [Box.md](./Box.md)
- Store: [event-store.md](../store-design/event-store.md)
- Integration: [integration.md](../store-design/integration.md)
