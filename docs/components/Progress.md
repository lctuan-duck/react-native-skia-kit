# Progress

Thanh tiến trình / vòng xoay loading. Tương đương Flutter `LinearProgressIndicator` / `CircularProgressIndicator`.

## Interface

```ts
type ProgressVariant = 'linear' | 'circular';

type ProgressStyle = ColorStyle & FlexChildStyle & {
  trackColor?: string;
  strokeWidth?: number;    // circular stroke width
  size?: number;           // circular diameter
  width?: number;          // linear width
  height?: number;         // linear height
};

interface ProgressProps {
  x?: number; y?: number;
  variant?: ProgressVariant;     // default: 'linear'
  value?: number;                // 0..1, undefined = indeterminate
  color?: SemanticColor | string | (SemanticColor | string)[];
  style?: ProgressStyle;
}
```

## `color` prop (chuỗi tĩnh hoặc mảng dải màu)

| Input | Hiệu ứng |
|-------|-----------|
| `'primary'` | Solid primary color |
| `'success'` | Solid success color |
| `['#ff0000', '#00ff00']` | Gradient đỏ → xanh |
| `['warning', 'error']` | Gradient vàng → đỏ |

## Cách dùng

```tsx
// Linear determinate
<Progress value={0.7} />

// Circular indeterminate (spinner)
<Progress variant="circular" />

// Gradient progress
<Progress value={0.5} color={['warning', 'error']} />

// Custom circular
<Progress variant="circular" color="info" style={{ size: 40, strokeWidth: 4 }} />
```
