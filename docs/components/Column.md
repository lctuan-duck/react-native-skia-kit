# Column Component

## Mục đích
- Sắp xếp children theo chiều **dọc** (vertical).
- Hỗ trợ mainAxisAlignment, crossAxisAlignment, spacing.

## Flutter tương đương
- `Column`

## Kiến trúc: Box wrapper → Yoga Layout

> **Column = `<Box>` với `flexDirection="column"`.** Yoga engine tính toán x/y cho từng child tự động.
> Children bên trong Column **KHÔNG CẦN** truyền `x, y`.

## TypeScript Interface

```ts
interface ColumnProps extends WidgetProps {
  x?: number;              // default: 0 — vị trí Column container
  y?: number;              // default: 0
  width?: number;          // default: auto
  height?: number;         // default: auto
  mainAxisAlignment?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  crossAxisAlignment?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
  padding?: number | [number, number, number, number];
  color?: string;
  borderRadius?: number;
  children?: React.ReactNode;
}
```

## Core Implementation

```tsx
import React from 'react';
import { Box } from './Box';

export const Column = React.memo(function Column({
  x = 0, y = 0,
  width, height,
  mainAxisAlignment = 'start',
  crossAxisAlignment = 'start',
  gap = 0,
  padding = 0,
  color = 'transparent',
  borderRadius = 0,
  children,
  ...rest
}: ColumnProps) {
  return (
    <Box
      x={x} y={y}
      width={width} height={height}
      color={color}
      borderRadius={borderRadius}
      flexDirection="column"
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

> Children bên trong Column **KHÔNG CẦN** `x, y`. Yoga inject tự động.

## Cách dùng

### Form layout
```tsx
<Column x={16} y={100} width={328} gap={16}>
  <Input placeholder="Email" />
  <Input placeholder="Password" secureTextEntry />
  <Button text="Đăng nhập" />
</Column>
{/* Yoga: Input1→(0,0), Input2→(0,56), Button→(0,112) */}
```

### Card content
```tsx
<Card x={16} y={100} width={328}>
  <Column padding={16} gap={8}>
    <Text text="Đơn hàng #1234" fontSize={18} fontWeight="bold" />
    <Divider />
    <Row mainAxisAlignment="spaceBetween">
      <Text text="Sản phẩm:" />
      <Text text="3 items" color={theme.colors.textSecondary} />
    </Row>
    <Row mainAxisAlignment="spaceBetween">
      <Text text="Tổng:" fontWeight="bold" />
      <Text text="450.000đ" fontWeight="bold" color={theme.colors.success} />
    </Row>
  </Column>
</Card>
```

### Centered content
```tsx
<Column x={0} y={0} width={360} height={800}
  mainAxisAlignment="center" crossAxisAlignment="center" gap={16}
>
  <Icon name="check" size={64} color={theme.colors.success} />
  <Text text="Thành công!" fontSize={24} fontWeight="bold" />
  <Text text="Đơn hàng đã được xác nhận" fontSize={14} color={theme.colors.textSecondary} />
  <Button text="Về trang chủ" onPress={goHome} />
</Column>
```

## Links
- Base: [Box.md](./Box.md)
- Related: [Row.md](./Row.md), [Expanded.md](./Expanded.md)
- Engine: [useYogaLayout.md](../hooks/useYogaLayout.md)
