# Spacer Component

## Mục đích
- Tạo khoảng trống trong layout giữa các element.

## Flutter tương đương
- `SizedBox`, `Spacer`

## Kiến trúc: Yoga-only (không vẽ gì)

> **Spacer KHÔNG có Canvas và KHÔNG vẽ gì lên Canvas.**
> Spacer chỉ tồn tại ở tầng Yoga layout để đẩy spacing.

## TypeScript Interface

```ts
interface SpacerProps {
  size?: number;           // default: 16
  orientation?: 'vertical' | 'horizontal'; // default: 'vertical'
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `size` | `number` | `16` | ❌ | Kích thước spacing |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | ❌ | Hướng spacing |

## Core Implementation

```tsx
import React from 'react';
import { useWidget } from '../hooks/useWidget';

export const Spacer = React.memo(function Spacer({
  size = 16,
  orientation = 'vertical',
}: SpacerProps) {
  // === Hook thay thế boilerplate ===
  useWidget({
    type: 'Spacer',
    layout: {
      x: 0, y: 0,
      width: orientation === 'horizontal' ? size : 0,
      height: orientation === 'vertical' ? size : 0,
    },
  });

  return null; // Không render Skia node
});
```

## Cách dùng

```tsx
// Layout engine tính space tự động khi dùng trong flex container
<Box flexDirection="column">
  <Text text="Line 1" />
  <Spacer size={16} />
  <Text text="Line 2" />
</Box>
```

## Links
- Store: [layout-store.md](../store-design/layout-store.md)
- Hook: [useWidgetId.md](../hooks/useWidgetId.md)
