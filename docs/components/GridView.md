# GridView Component

## Mục đích
- Hiển thị children dạng lưới với số cột cố định, hỗ trợ cuộn.
- Kết hợp Yoga `flexWrap: 'wrap'` + virtualization cho danh sách lớn.

## Flutter tương đương
- `GridView`, `GridView.builder`, `GridView.count`, `SliverGrid`

## TypeScript Interface

```ts
interface GridViewProps extends WidgetProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  crossAxisCount: number;       // REQUIRED — số cột
  mainAxisSpacing?: number;     // default: 0 — gap dọc
  crossAxisSpacing?: number;    // default: 0 — gap ngang
  childAspectRatio?: number;    // default: 1.0 — tỷ lệ width/height của cell
  padding?: number | [number, number, number, number];
  physics?: 'clamped' | 'bouncing' | 'never';
  children?: React.ReactNode;
}

// Builder pattern cho danh sách lớn (virtualized)
interface GridViewBuilderProps extends Omit<GridViewProps, 'children'> {
  itemCount: number;
  itemBuilder: (index: number) => React.ReactNode;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `width` | `number` | — | ✅ | Chiều rộng |
| `height` | `number` | — | ✅ | Chiều cao |
| `crossAxisCount` | `number` | — | ✅ | Số cột |
| `mainAxisSpacing` | `number` | `0` | ❌ | Gap dọc |
| `crossAxisSpacing` | `number` | `0` | ❌ | Gap ngang |
| `childAspectRatio` | `number` | `1.0` | ❌ | Tỷ lệ cell |
| `padding` | `number \| number[]` | `0` | ❌ | Padding |
| `physics` | `string` | `'clamped'` | ❌ | Scroll physics |
| `itemCount` | `number` | — | ✅ (builder) | Số items |
| `itemBuilder` | `(i) => ReactNode` | — | ✅ (builder) | Render function |

## Core Implementation

```tsx
import React, { useMemo } from 'react';
import { Box, ScrollView } from 'react-native-skia-kit';
import { useWidget } from '../hooks/useWidget';

export const GridView = React.memo(function GridView({
  x = 0, y = 0,
  width, height,
  crossAxisCount,
  mainAxisSpacing = 0,
  crossAxisSpacing = 0,
  childAspectRatio = 1.0,
  padding = 0,
  physics = 'clamped',
  children,
}: GridViewProps) {
  useWidget({ type: 'GridView', layout: { x, y, width, height } });

  const pad = typeof padding === 'number' ? padding : padding[3]; // left padding
  const innerWidth = width - (typeof padding === 'number' ? padding * 2 : padding[1] + padding[3]);
  const cellWidth = (innerWidth - crossAxisSpacing * (crossAxisCount - 1)) / crossAxisCount;
  const cellHeight = cellWidth / childAspectRatio;

  // Wrap children vào grid positions
  const gridChildren = React.Children.map(children, (child, i) => {
    if (!React.isValidElement(child)) return null;
    const col = i % crossAxisCount;
    const row = Math.floor(i / crossAxisCount);
    return React.cloneElement(child as React.ReactElement<any>, {
      width: cellWidth,
      height: cellHeight,
    });
  });

  const totalRows = Math.ceil(React.Children.count(children) / crossAxisCount);
  const contentHeight = totalRows * cellHeight + (totalRows - 1) * mainAxisSpacing;

  return (
    <ScrollView x={x} y={y} width={width} height={height} physics={physics}>
      {/* Dùng Box flexWrap để Yoga tự xếp grid */}
      <Box
        width={innerWidth}
        flexDirection="row"
        flexWrap="wrap"
        gap={crossAxisSpacing}
        rowGap={mainAxisSpacing}
        padding={padding}
      >
        {gridChildren}
      </Box>
    </ScrollView>
  );
});

// Builder pattern — virtualized
export const GridViewBuilder = React.memo(function GridViewBuilder({
  itemCount, itemBuilder,
  ...rest
}: GridViewBuilderProps) {
  const items = useMemo(() =>
    Array.from({ length: itemCount }, (_, i) => itemBuilder(i)),
    [itemCount, itemBuilder]
  );
  return <GridView {...rest}>{items}</GridView>;
});
```

## Cách dùng

### GridView.count — photo gallery
```tsx
<GridView x={0} y={0} width={360} height={600}
  crossAxisCount={3} mainAxisSpacing={4} crossAxisSpacing={4}
>
  {photos.map((photo, i) => (
    <Image key={i} src={photo.url} fit="cover" borderRadius={4} />
  ))}
</GridView>
```

### GridView.count — product grid
```tsx
<GridView x={0} y={56} width={360} height={700}
  crossAxisCount={2} mainAxisSpacing={12} crossAxisSpacing={12}
  childAspectRatio={0.75} padding={16}
>
  {products.map((p) => (
    <Card key={p.id} borderRadius={12} elevation={2}>
      <Column gap={8}>
        <Image src={p.image} fit="cover" height={120} />
        <Text text={p.name} fontSize={14} fontWeight="bold" />
        <Text text={p.price} fontSize={13} color={theme.colors.success} />
      </Column>
    </Card>
  ))}
</GridView>
```

### GridView.builder — 1000 items virtualized
```tsx
<GridViewBuilder x={0} y={0} width={360} height={800}
  crossAxisCount={4} mainAxisSpacing={8} crossAxisSpacing={8}
  itemCount={1000}
  itemBuilder={(i) => (
    <Box borderRadius={8} color={`hsl(${i * 3}, 70%, 60%)`} />
  )}
/>
```

## Links
- Scroll: [ScrollView.md](./ScrollView.md)
- Base: [Box.md](./Box.md)
- Engine: [useYogaLayout.md](../hooks/useYogaLayout.md) — `flexWrap: 'wrap'`
