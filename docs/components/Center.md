# Center & Align Components

## Mục đích
- **Center**: Căn giữa child cả ngang và dọc.
- **Align**: Căn child theo vị trí tùy chỉnh (topLeft, bottomRight, v.v.).

## Flutter tương đương
- `Center`, `Align`, `Alignment`

## Kiến trúc: Box wrapper → Yoga justify/align

> **Center = Box với `justifyContent: center` + `alignItems: center`.**
> Yoga tự tính vị trí child ở giữa container.

## TypeScript Interface

```ts
interface CenterProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;           // REQUIRED
  height?: number;          // REQUIRED
  children: React.ReactNode;
}

type AlignmentValue =
  | 'topLeft' | 'topCenter' | 'topRight'
  | 'centerLeft' | 'center' | 'centerRight'
  | 'bottomLeft' | 'bottomCenter' | 'bottomRight';

interface AlignProps extends CenterProps {
  alignment?: AlignmentValue;
}
```

## Core Implementation

```tsx
import React from 'react';
import { Box } from './Box';

const ALIGN_MAP: Record<AlignmentValue, { justifyContent: string; alignItems: string }> = {
  topLeft:      { justifyContent: 'start',  alignItems: 'start' },
  topCenter:    { justifyContent: 'start',  alignItems: 'center' },
  topRight:     { justifyContent: 'start',  alignItems: 'end' },
  centerLeft:   { justifyContent: 'center', alignItems: 'start' },
  center:       { justifyContent: 'center', alignItems: 'center' },
  centerRight:  { justifyContent: 'center', alignItems: 'end' },
  bottomLeft:   { justifyContent: 'end',    alignItems: 'start' },
  bottomCenter: { justifyContent: 'end',    alignItems: 'center' },
  bottomRight:  { justifyContent: 'end',    alignItems: 'end' },
};

export const Center = React.memo(function Center({
  x = 0, y = 0, width, height, children,
}: CenterProps) {
  // Box detect justifyContent+alignItems → gọi useYogaLayout
  return (
    <Box x={x} y={y} width={width} height={height}
      flexDirection="column" justifyContent="center" alignItems="center">
      {children}
    </Box>
  );
});

export const Align = React.memo(function Align({
  x = 0, y = 0, width, height, alignment = 'center', children,
}: AlignProps) {
  const { justifyContent, alignItems } = ALIGN_MAP[alignment];
  return (
    <Box x={x} y={y} width={width} height={height}
      flexDirection="column" justifyContent={justifyContent} alignItems={alignItems}>
      {children}
    </Box>
  );
});
```

> Child bên trong **KHÔNG CẦN** x/y. Yoga tự tính vị trí căn giữa/căn góc.

## Cách dùng

```tsx
// Loading screen
<Center x={0} y={0} width={360} height={800}>
  <CircularProgress size={48} color={theme.colors.primary} />
  <Text text="Đang tải..." fontSize={14} color={theme.colors.textSecondary} />
</Center>

// FAB góc phải dưới
<Align x={0} y={0} width={360} height={800} alignment="bottomRight">
  <Box padding={16}>
    <FloatingActionButton icon="add" onPress={addNew} />
  </Box>
</Align>
```

## Links
- Base: [Box.md](./Box.md)
- Related: [Stack.md](./Stack.md), [Row.md](./Row.md), [Column.md](./Column.md)
- Engine: [useYogaLayout.md](../hooks/useYogaLayout.md)
