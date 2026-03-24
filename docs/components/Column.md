# Column

Xếp children theo hàng dọc. Tương đương Flutter `Column`.

## Interface

```ts
type FlexContainerComponentStyle = LayoutStyle & SpacingStyle & ColorStyle
  & BorderStyle & FlexChildStyle & Pick<FlexContainerStyle, 'gap' | 'rowGap'>;

interface ColumnProps {
  x?: number;
  y?: number;
  style?: FlexContainerComponentStyle;
  mainAxisAlignment?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  crossAxisAlignment?: 'start' | 'center' | 'end' | 'stretch';
  children?: React.ReactNode;
}
```

## Cách dùng

```tsx
// Layout dọc
<Column style={{ width: 360, height: 800, gap: 12, padding: 16 }}>
  <Box style={{ height: 56, backgroundColor: '#1A73E8' }} />
  <Box style={{ flex: 1, backgroundColor: '#f5f5f5' }} />
  <Box style={{ height: 64, backgroundColor: '#333' }} />
</Column>

// Căn giữa nội dung
<Column style={{ width: 360, height: 400 }}
  mainAxisAlignment="center"
  crossAxisAlignment="center"
>
  <Text text="Centered content" style={{ fontSize: 20 }} />
</Column>
```
