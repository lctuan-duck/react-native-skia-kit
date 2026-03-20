# Divider Component

## Mục đích
- Đường phân cách ngang hoặc dọc giữa các phần tử UI.

## Flutter tương đương
- `Divider`, `VerticalDivider`

## Kiến trúc: Skia Line Node

> **Divider KHÔNG có Canvas riêng.** Divider là một `<Line>` vẽ trực tiếp vào Canvas chung.

## TypeScript Interface

```ts
interface DividerProps extends WidgetProps {
  x?: number;              // default: 0
  y?: number;              // default: 0
  length?: number;         // default: 300
  orientation?: 'horizontal' | 'vertical'; // default: 'horizontal'
  thickness?: number;      // default: 1
  color?: string;          // default: theme.colors.divider
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Start X |
| `y` | `number` | `0` | ❌ | Start Y |
| `length` | `number` | `300` | ❌ | Chiều dài |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | ❌ | Hướng |
| `thickness` | `number` | `1` | ❌ | Độ dày |
| `color` | `string` | `theme.divider` | ❌ | Màu |

## Core Implementation

```tsx
import React from 'react';
import { Line } from '@shopify/react-native-skia';
import { useTheme } from '../hooks/useTheme';

export const Divider = React.memo(function Divider({
  x = 0, y = 0,
  length = 300,
  orientation = 'horizontal',
  thickness = 1,
  color,                  // undefined → theme.colors.divider
}: DividerProps) {
  const theme = useTheme();
  const lineColor = color ?? theme.colors.divider;
  if (orientation === 'horizontal') {
    return <Line p1={{ x, y }} p2={{ x: x + length, y }} strokeWidth={thickness} color={lineColor} />;
  }
  return <Line p1={{ x, y }} p2={{ x, y: y + length }} strokeWidth={thickness} color={lineColor} />;
});
```

## Cách dùng

```tsx
<CanvasRoot>
  <Text x={16} y={100} text="Section A" />
  <Divider x={16} y={130} length={328} />
  <Text x={16} y={148} text="Section B" />
</CanvasRoot>
```

## Links
- Phase: [phase3_base_widget.md](../plans/phase3_base_widget.md)
