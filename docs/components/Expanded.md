# Expanded & Flexible Components

## Mục đích
- **Expanded**: Chiếm toàn bộ không gian còn lại trong Row/Column (flex: 1).
- **Flexible**: Chiếm tỷ lệ không gian theo `flex` nhưng không bắt buộc fill hết.

## Flutter tương đương
- `Expanded`, `Flexible`

## TypeScript Interface

```ts
interface ExpandedProps {
  flex?: number;           // default: 1
  children: React.ReactNode;
}

interface FlexibleProps {
  flex?: number;           // default: 1
  fit?: 'tight' | 'loose'; // default: 'loose'
  children: React.ReactNode;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `flex` | `number` | `1` | ❌ | Tỷ lệ flex |
| `fit` | `'tight' \| 'loose'` | `'loose'` | ❌ | Tight = fill hết, Loose = fit content |
| `children` | `ReactNode` | — | ✅ | Nội dung |

## Core Implementation

```tsx
import React from 'react';
import { Box } from './Box';

// Expanded = Flexible nhưng luôn fit: 'tight'
export const Expanded = React.memo(function Expanded({
  flex = 1,
  children,
}: ExpandedProps) {
  return (
    <Box flex={flex} alignSelf="stretch">
      {children}
    </Box>
  );
});

export const Flexible = React.memo(function Flexible({
  flex = 1,
  fit = 'loose',
  children,
}: FlexibleProps) {
  return (
    <Box flex={flex} alignSelf={fit === 'tight' ? 'stretch' : 'auto'}>
      {children}
    </Box>
  );
});
```

## Cách dùng

### Search bar: icon + input mở rộng
```tsx
<Row x={16} y={100} width={328} height={48} gap={8} crossAxisAlignment="center">
  <Icon name="search" size={24} color={theme.colors.textSecondary} />
  <Expanded>
    <Input placeholder="Tìm kiếm..." width={260} height={40} />
  </Expanded>
  <Icon name="filter" size={24} color={theme.colors.textSecondary} />
</Row>
```

### 2 cột tỷ lệ 2:1
```tsx
<Row x={16} y={200} width={328} gap={12}>
  <Expanded flex={2}>
    <Card height={120}>
      <Text text="Nội dung chính" />
    </Card>
  </Expanded>
  <Expanded flex={1}>
    <Card height={120}>
      <Text text="Sidebar" />
    </Card>
  </Expanded>
</Row>
```

### Flexible — buttons không stretch
```tsx
<Row x={16} y={300} width={328} mainAxisAlignment="end" gap={8}>
  <Flexible>
    <Button text="Hủy" color={theme.colors.surfaceVariant} textColor={theme.colors.textBody} />
  </Flexible>
  <Flexible>
    <Button text="Lưu" />
  </Flexible>
</Row>
```

## Links
- Used in: [Row.md](./Row.md), [Column.md](./Column.md)
- Base: [Box.md](./Box.md)
- Layout: [layout-store.md](../store-design/layout-store.md)
