# Switch Component

## Mục đích
- Toggle on/off, hỗ trợ animation trượt thumb.

## Flutter tương đương
- `Switch`, `CupertinoSwitch`

## Kiến trúc: Composition (Tái sử dụng Box) + Reanimated

> **Switch KHÔNG vẽ Skia nguyên thủy.**
> Switch = `<Box>` (track nền bo tròn) + `<Box>` tròn (thumb, animated position).

## TypeScript Interface

```ts
interface SwitchProps extends WidgetProps {
  x?: number;              // default: 0
  y?: number;              // default: 0
  width?: number;          // default: 48
  height?: number;         // default: 28
  value?: boolean;         // default: false
  disabled?: boolean;      // default: false
  color?: string;          // default: theme.colors.primary — màu track khi ON
  trackColor?: string;     // default: theme.colors.border — màu track khi OFF
  thumbColor?: string;     // default: theme.colors.onPrimary
  onChange?: (value: boolean) => void;
  onPress?: () => void;
  hitTestBehavior?: HitTestBehavior; // default: 'opaque'
  accessibilityLabel?: string;
  accessibilityRole?: string; // default: 'switch'
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `width` | `number` | `48` | ❌ | Chiều rộng track |
| `height` | `number` | `28` | ❌ | Chiều cao |
| `value` | `boolean` | `false` | ❌ | Trạng thái ON/OFF |
| `disabled` | `boolean` | `false` | ❌ | Vô hiệu hóa |
| `color` | `string` | `theme.primary` | ❌ | Màu track ON |
| `trackColor` | `string` | `theme.border` | ❌ | Màu track OFF |
| `thumbColor` | `string` | `theme.onPrimary` | ❌ | Màu thumb |
| `onChange` | `(value: boolean) => void` | — | ❌ | Callback khi toggle |

## Core Implementation (Composition + Store)

```tsx
import React, { useEffect } from 'react';
import { Circle } from '@shopify/react-native-skia';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useTheme } from '../hooks/useTheme';

export const Switch = React.memo(function Switch({
  x = 0, y = 0,
  width = 48, height = 28,
  value = false,
  disabled = false,
  color,                  // undefined → theme.colors.primary
  trackColor,             // undefined → theme.colors.border
  thumbColor = 'white',
  onChange,
  onPress,
  accessibilityLabel,
}: SwitchProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const inactiveTrack = trackColor ?? theme.colors.border;

  const thumbR = height / 2 - 2;
  const thumbX = useSharedValue(value ? x + width - thumbR - 4 : x + thumbR + 4);

  useEffect(() => {
    thumbX.value = withTiming(value ? x + width - thumbR - 4 : x + thumbR + 4, { duration: 200 });
  }, [value]);

  const trackFill = value ? (disabled ? theme.colors.textDisabled : activeColor) : inactiveTrack;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!value);
    onPress?.();
  };

  // === Hook thay thế boilerplate ===
  const widgetId = useWidget<{ value: boolean; disabled: boolean }>({
    type: 'Switch',
    layout: { x, y, width, height },
    props: { value, disabled },
  });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: { onPress: handlePress },
    behavior: 'opaque',
  });

  return (
    <Box
      x={x} y={y}
      width={width} height={height}
      borderRadius={height / 2}
      color={trackFill}
      opacity={disabled ? 0.5 : 1}
      hitTestBehavior="opaque"
      onPress={handlePress}
    >
      {/* Thumb — Circle vì cần animated cx */}
      <Circle
        cx={thumbX}
        cy={y + height / 2}
        r={thumbR}
        color={thumbColor}
      />
    </Box>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<CanvasRoot>
  <Text x={16} y={100} text="Thông báo" fontSize={16} />
  <Switch x={296} y={92} value={notify} onChange={setNotify} />
</CanvasRoot>
```

### Disabled
```tsx
<Switch x={296} y={130} value={true} disabled />
<Text x={16} y={136} text="Luôn bật (disabled)" fontSize={14} color={theme.colors.textDisabled} />
```

### Trong Card
```tsx
<Card x={16} y={100} width={328} height={60}>
  <Text x={32} y={124} text="Dark Mode" fontSize={14} />
  <Switch x={280} y={118} value={darkMode} onChange={setDarkMode} />
</Card>
```

## Events
| Event | Mô tả | Gesture Recognizer |
|-------|--------|-------------------|
| `onPress` | Tap vào switch | TapGestureRecognizer |
| `onChange` | Value ON/OFF thay đổi | — (gọi từ onPress) |

## Links
- Base: [Box.md](./Box.md)
- Animation: [phase8_animation.md](../plans/phase8_animation.md)
- Store: [event-store.md](../store-design/event-store.md)
- Integration: [integration.md](../store-design/integration.md)
