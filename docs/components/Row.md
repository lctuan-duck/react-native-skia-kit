# Row Component

## Mục đích
- Sắp xếp children theo chiều **ngang** (horizontal).
- Hỗ trợ mainAxisAlignment, crossAxisAlignment, spacing.

## Flutter tương đương
- `Row`

## Kiến trúc: Box wrapper → Yoga Layout

> **Row = `<Box>` với `flexDirection="row"`.** Yoga engine tính toán x/y cho từng child tự động.
> Children bên trong Row **KHÔNG CẦN** truyền `x, y` — Yoga inject qua `React.cloneElement`.

## TypeScript Interface

```ts
interface RowProps extends WidgetProps {
  x?: number;              // default: 0 — vị trí Row container
  y?: number;              // default: 0
  width?: number;          // default: auto (fit parent)
  height?: number;         // default: auto (fit content)
  mainAxisAlignment?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  crossAxisAlignment?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;            // default: 0
  padding?: number | [number, number, number, number];
  color?: string;          // default: 'transparent'
  borderRadius?: number;
  children?: React.ReactNode;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Vị trí Row container |
| `y` | `number` | `0` | ❌ | Vị trí Row container |
| `width` | `number` | auto | ❌ | Chiều rộng |
| `height` | `number` | auto | ❌ | Chiều cao |
| `mainAxisAlignment` | `string` | `'start'` | ❌ | Căn ngang |
| `crossAxisAlignment` | `string` | `'center'` | ❌ | Căn dọc |
| `gap` | `number` | `0` | ❌ | Khoảng cách giữa children |
| `padding` | `number \| number[]` | `0` | ❌ | Padding trong |
| `color` | `string` | `'transparent'` | ❌ | Màu nền |
| `children` | `ReactNode` | — | ❌ | Nội dung |

## Core Implementation

```tsx
import React from 'react';
import { Box } from './Box';

export const Row = React.memo(function Row({
  x = 0, y = 0,
  width, height,
  mainAxisAlignment = 'start',
  crossAxisAlignment = 'center',
  gap = 0,
  padding = 0,
  color = 'transparent',
  borderRadius = 0,
  children,
  ...rest
}: RowProps) {
  // Box detect flexDirection → gọi useYogaLayout bên trong
  // → tính x/y cho từng child → inject qua cloneElement
  return (
    <Box
      x={x} y={y}
      width={width} height={height}
      color={color}
      borderRadius={borderRadius}
      flexDirection="row"
      justifyContent={mainAxisAlignment}
      alignItems={crossAxisAlignment}
      gap={gap}
      padding={padding}
      {...rest}
    >
      {children}
    </Box>
  );
});
```

> **Note**: Children bên trong Row **KHÔNG CẦN** truyền `x, y`.
> Box (parent) sẽ gọi `useYogaLayout()` → `React.cloneElement` inject `x, y, width, height` tự động.

## Cách dùng

### 3 nút ngang hàng
```tsx
<Row x={16} y={100} width={328} gap={12}>
  <Button text="Hủy" color={theme.colors.surfaceVariant} textColor={theme.colors.textBody} />
  <Button text="Lưu" />
  <Button text="Gửi" color={theme.colors.success} />
</Row>
{/* Yoga tính: Hủy→(0,0), Lưu→(112,0), Gửi→(224,0) tự động */}
```

### spaceBetween — logo + avatar
```tsx
<Row x={0} y={0} width={360} height={60} mainAxisAlignment="spaceBetween" padding={16}>
  <Text text="MyApp" fontSize={20} fontWeight="bold" />
  <Avatar size={36} src={user.avatar} />
</Row>
```

### crossAxisAlignment — icon + text căn giữa dọc
```tsx
<Row gap={8} crossAxisAlignment="center">
  <Icon name="star" size={20} color="gold" />
  <Text text="4.8" fontSize={16} fontWeight="bold" />
  <Text text="(128 reviews)" fontSize={13} color={theme.colors.textSecondary} />
</Row>
```

### Lồng nhau (Row trong Column)
```tsx
<Column x={16} y={100} width={328} gap={12}>
  <Row mainAxisAlignment="spaceBetween">
    <Text text="Tổng cộng" fontSize={16} />
    <Text text="1.200.000đ" fontSize={16} fontWeight="bold" color={theme.colors.success} />
  </Row>
  <Row mainAxisAlignment="end" gap={8}>
    <Button text="Hủy" color={theme.colors.surfaceVariant} textColor={theme.colors.textBody} />
    <Button text="Thanh toán" />
  </Row>
</Column>
```

## Links
- Base: [Box.md](./Box.md) (gọi `useYogaLayout` bên trong)
- Related: [Column.md](./Column.md), [Expanded.md](./Expanded.md)
- Engine: [useYogaLayout.md](../hooks/useYogaLayout.md)
- Phase: [phase4_layout_engine.md](../plans/phase4_layout_engine.md)
