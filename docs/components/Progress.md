# Progress Component

## Mục đích
- Hiển thị tiến độ dạng thanh ngang (linear) hoặc vòng tròn (circular).
- Hỗ trợ determinate (có giá trị %) và indeterminate (loading spinner).

## Flutter tương đương
- `LinearProgressIndicator`, `CircularProgressIndicator`

## TypeScript Interface

```ts
type ProgressVariant = 'linear' | 'circular';

interface ProgressProps extends WidgetProps {
  x?: number;
  y?: number;

  // Mode
  variant?: ProgressVariant;  // default: 'linear'
  value?: number;             // 0..1 — nếu undefined → indeterminate
  
  // Appearance
  color?: string;             // default: theme.colors.primary
  trackColor?: string;        // default: theme.colors.surfaceVariant
  
  // Linear specific
  width?: number;             // default: 200
  height?: number;            // default: 4 (linear), ignored (circular)
  borderRadius?: number;      // default: height/2
  
  // Circular specific
  size?: number;              // default: 48 — diameter
  strokeWidth?: number;       // default: 4
}
```

## Core Implementation

```tsx
import React from 'react';
import { RoundedRect, Circle, Path } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useWidget } from 'react-native-skia-kit/hooks';
import { useTheme } from 'react-native-skia-kit/hooks';

export const Progress = React.memo(function Progress({
  x = 0, y = 0,
  variant = 'linear',
  value,
  color,                  // undefined → theme.colors.primary
  trackColor,             // undefined → theme.colors.surfaceVariant
  width = 200, height = 4,
  borderRadius,
  size = 48, strokeWidth = 4,
}: ProgressProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const trackBg = trackColor ?? theme.colors.surfaceVariant;
  const isDeterminate = value != null;
  const widgetId = useWidget({ type: 'Progress', layout: { x, y, width: variant === 'circular' ? size : width, height: variant === 'circular' ? size : height } });

  // === LINEAR ===
  if (variant === 'linear') {
    const r = borderRadius ?? height / 2;
    const fillWidth = isDeterminate ? width * Math.min(1, Math.max(0, value!)) : width * 0.4;

    // Indeterminate: animate position
    const animX = useSharedValue(0);
    if (!isDeterminate) {
      animX.value = withRepeat(withTiming(width - fillWidth, { duration: 1000 }), -1, true);
    }

    return (
      <>
        <RoundedRect x={x} y={y} width={width} height={height} r={r} color={trackColor} />
        <RoundedRect
          x={isDeterminate ? x : x + animX.value}
          y={y} width={fillWidth} height={height} r={r} color={color}
        />
      </>
    );
  }

  // === CIRCULAR ===
  const cx = x + size / 2;
  const cy = y + size / 2;
  const radius = (size - strokeWidth) / 2;

  // Indeterminate: rotate animation
  const rotation = useSharedValue(0);
  if (!isDeterminate) {
    rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
  }

  const sweepAngle = isDeterminate ? 360 * Math.min(1, Math.max(0, value!)) : 270;

  return (
    <>
      {/* Track */}
      <Circle cx={cx} cy={cy} r={radius} color={trackColor}
        style="stroke" strokeWidth={strokeWidth} />
      {/* Progress arc */}
      <Path
        path={makeArcPath(cx, cy, radius, isDeterminate ? -90 : -90 + rotation.value, sweepAngle)}
        color={color} style="stroke" strokeWidth={strokeWidth}
        strokeCap="round"
      />
    </>
  );
});
```

## Cách dùng

### Linear — determinate
```tsx
<Progress value={0.65} width={300} color={theme.colors.success} />
```

### Linear — indeterminate
```tsx
<Progress width={300} />  {/* no value → auto animate */}
```

### Circular — loading spinner
```tsx
<Progress variant="circular" size={40} />
```

### Circular — upload progress
```tsx
<Progress variant="circular" value={uploadProgress} size={56} strokeWidth={6} color={theme.colors.tertiary} />
```

### In Card
```tsx
<Card>
  <Column padding={16} gap={12}>
    <Row mainAxisAlignment="spaceBetween">
      <Text text="Đang tải..." fontSize={14} />
      <Text text={`${Math.round(progress * 100)}%`} fontSize={14} color={theme.colors.textSecondary} />
    </Row>
    <Progress value={progress} width={296} />
  </Column>
</Card>
```

## Links
- Base: [Box.md](./Box.md)
- Used by: Loading states, upload progress, skill bars
