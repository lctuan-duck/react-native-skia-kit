# Slider Component

## Mục đích
- Cho phép chọn giá trị liên tục bằng cách kéo thumb.

## Flutter tương đương
- `Slider`, `CupertinoSlider`

## Kiến trúc: Composition (Tái sử dụng Box) + Gesture Arena

> **Slider KHÔNG vẽ Skia nguyên thủy.**
> Slider = `<Box>` (track background) + `<Box>` (active fill) + `<Box>` tròn (thumb).

## HitTestBehavior & Gesture Arena
- **`opaque`** — Slider chặn event.
- Đăng ký **HorizontalDragRecognizer** vào Gesture Arena.
- Slider trong ScrollView dọc: kéo ngang → Slider thắng; kéo dọc → ScrollView thắng.

## TypeScript Interface

```ts
interface SliderProps extends WidgetProps {
  x?: number;              // default: 0
  y?: number;              // default: 0
  width?: number;          // default: 200
  min?: number;            // default: 0
  max?: number;            // default: 100
  value?: number;          // default: 0
  disabled?: boolean;      // default: false
  color?: string;          // default: theme.colors.primary
  trackColor?: string;     // default: theme.colors.surfaceVariant
  thumbColor?: string;     // default: theme.colors.onPrimary
  onChange?: (value: number) => void;
  hitTestBehavior?: HitTestBehavior; // default: 'opaque'
  accessibilityLabel?: string;
  accessibilityRole?: string; // default: 'adjustable'
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `width` | `number` | `200` | ❌ | Chiều dài track |
| `min` | `number` | `0` | ❌ | Giá trị nhỏ nhất |
| `max` | `number` | `100` | ❌ | Giá trị lớn nhất |
| `value` | `number` | `0` | ❌ | Giá trị hiện tại |
| `disabled` | `boolean` | `false` | ❌ | Vô hiệu hóa |
| `color` | `string` | `theme.primary` | ❌ | Màu active fill |
| `trackColor` | `string` | `theme.surfaceVariant` | ❌ | Màu track nền |
| `thumbColor` | `string` | `theme.onPrimary` | ❌ | Màu thumb |
| `onChange` | `(value: number) => void` | — | ❌ | Callback khi drag |

## Core Implementation (Composition + Store)

```tsx
import React from 'react';
import { Circle } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';

export const Slider = React.memo(function Slider({
  x = 0, y = 0,
  width = 200,
  min = 0, max = 100,
  value = 0,
  color,                  // undefined → theme.colors.primary
  trackColor,             // undefined → theme.colors.surfaceVariant
  thumbColor = 'white',
  disabled = false,
  onChange,
  accessibilityLabel,
}: SliderProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const trackBg = trackColor ?? theme.colors.surfaceVariant;
  const trackH = 6;
  const thumbR = 12;
  const totalHeight = thumbR * 2;
  const trackY = y + thumbR - trackH / 2;

  const thumbCx = useDerivedValue(() => {
    return x + ((value - min) / (max - min)) * width;
  }, [value]);

  const fillWidth = ((value - min) / (max - min)) * width;

  const handlePanUpdate = (e: any) => {
    if (disabled) return;
    const newValue = Math.min(max, Math.max(min,
      min + ((e.x - x) / width) * (max - min)
    ));
    onChange?.(Math.round(newValue));
  };

  // === Hook thay thế boilerplate ===
  useWidget<{ value: number; min: number; max: number; disabled: boolean }>({
    type: 'Slider',
    layout: { x, y, width, height: totalHeight },
    props: { value, min, max, disabled },
  });

  // Box handles onPanUpdate via props — no useHitTest needed

  return (
    <Box
      x={x} y={y}
      width={width} height={totalHeight}
      color="transparent"
      opacity={disabled ? 0.5 : 1}
      hitTestBehavior="opaque"
      onPanUpdate={handlePanUpdate}
    >
      {/* Track background */}
      <Box x={x} y={trackY} width={width} height={trackH} borderRadius={trackH / 2} color={trackBg} />

      {/* Active fill */}
      <Box x={x} y={trackY} width={fillWidth} height={trackH} borderRadius={trackH / 2} color={activeColor} />

      {/* Thumb — Circle + border */}
      <Circle cx={thumbCx} cy={y + thumbR} r={thumbR} color={thumbColor} />
      <Circle cx={thumbCx} cy={y + thumbR} r={thumbR} color={color} style="stroke" strokeWidth={2} />
    </Box>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<CanvasRoot>
  <Text x={16} y={200} text={`Âm lượng: ${volume}%`} />
  <Slider x={16} y={230} width={328} min={0} max={100} value={volume} onChange={setVolume} />
</CanvasRoot>
```

### Trong Card
```tsx
<Card x={16} y={100} width={328} height={100}>
  <Text x={32} y={118} text="Độ sáng" fontSize={14} />
  <Slider x={32} y={142} width={264} value={brightness} onChange={setBrightness} />
</Card>
```

## Events
| Event | Mô tả | Gesture Recognizer |
|-------|--------|-------------------|
| `onChange` | Value thay đổi khi drag | HorizontalDragRecognizer |
| `onPanUpdate` | Internal — tính value từ position | — |

## Links
- Base: [Box.md](./Box.md)
- Gesture: [event-store.md](../store-design/event-store.md) (Gesture Arena, HorizontalDragRecognizer)
- Integration: [integration.md](../store-design/integration.md)
