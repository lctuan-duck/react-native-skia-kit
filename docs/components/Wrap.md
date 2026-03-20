# Wrap Component

## Mục đích
- Sắp xếp children theo hàng, tự xuống hàng mới khi hết chỗ.
- Dùng cho tags, chips, labels có số lượng không cố định.

## Flutter tương đương
- `Wrap`

## Kiến trúc: Box + Yoga `flexWrap: 'wrap'`

> **Wrap = Box với `flexDirection="row"` + `flexWrap="wrap"`.** Yoga tự break line khi child vượt width.

## TypeScript Interface

```ts
interface WrapProps extends WidgetProps {
  x?: number;
  y?: number;
  width: number;           // REQUIRED — cần width để biết khi nào xuống hàng
  spacing?: number;        // default: 0 — gap ngang giữa children
  runSpacing?: number;     // default: 0 — gap dọc giữa hàng
  alignment?: 'start' | 'center' | 'end';        // default: 'start'
  crossAxisAlignment?: 'start' | 'center' | 'end'; // default: 'start'
  children?: React.ReactNode;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `width` | `number` | — | ✅ | Chiều rộng (để tính break line) |
| `spacing` | `number` | `0` | ❌ | Gap ngang |
| `runSpacing` | `number` | `0` | ❌ | Gap dọc (giữa hàng) |
| `alignment` | `string` | `'start'` | ❌ | Căn ngang trong hàng |
| `crossAxisAlignment` | `string` | `'start'` | ❌ | Căn dọc |

## Core Implementation

```tsx
import React from 'react';
import { Box } from './Box';

export const Wrap = React.memo(function Wrap({
  x = 0, y = 0,
  width,
  spacing = 0,
  runSpacing = 0,
  alignment = 'start',
  crossAxisAlignment = 'start',
  children,
}: WrapProps) {
  return (
    <Box
      x={x} y={y} width={width}
      flexDirection="row"
      flexWrap="wrap"
      gap={spacing}
      rowGap={runSpacing}
      justifyContent={alignment}
      alignItems={crossAxisAlignment}
    >
      {children}
    </Box>
  );
});
```

> Yoga `flexWrap: 'wrap'` xử lý tất cả — tự break line khi children vượt width.

## Cách dùng

### Tags / Labels
```tsx
<Wrap x={16} y={100} width={328} spacing={8} runSpacing={8}>
  <Chip label="React Native" />
  <Chip label="Skia" />
  <Chip label="Canvas" />
  <Chip label="Yoga Layout" />
  <Chip label="Flutter-like" />
  <Chip label="TypeScript" />
  <Chip label="Animations" />
</Wrap>
{/* Yoga tự xuống hàng khi tổng width > 328 */}
```

### Filter options
```tsx
<Wrap x={16} y={200} width={328} spacing={8} runSpacing={8}>
  {categories.map((cat) => (
    <Chip
      key={cat.id}
      label={cat.name}
      selected={selectedIds.includes(cat.id)}
      onPress={() => toggle(cat.id)}
    />
  ))}
</Wrap>
```

### Centered badges
```tsx
<Wrap x={0} y={300} width={360} spacing={12} runSpacing={12} alignment="center">
  <Badge value={1} />
  <Badge value={2} />
  <Badge value={3} />
  <Badge value={4} />
  <Badge value={5} />
</Wrap>
```

## Links
- Base: [Box.md](./Box.md) — `flexWrap: 'wrap'`
- Related: [Chip.md](./Chip.md), [GridView.md](./GridView.md)
- Engine: [useYogaLayout.md](../hooks/useYogaLayout.md)
