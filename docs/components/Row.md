# Row

Xếp children theo hàng ngang. Tương đương Flutter `Row`.

## Interface

```ts
type FlexContainerComponentStyle = LayoutStyle & SpacingStyle & ColorStyle
  & BorderStyle & FlexChildStyle & Pick<FlexContainerStyle, 'gap' | 'rowGap'>;

interface RowProps {
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
// Hàng ngang cơ bản
<Row mainAxisAlignment="spaceBetween" crossAxisAlignment="center">
  <Text text="Left" style={{ fontSize: 14 }} />
  <Text text="Right" style={{ fontSize: 14 }} />
</Row>

// Row với gap
<Row style={{ gap: 8 }}>
  <Chip label="Tag 1" />
  <Chip label="Tag 2" />
  <Chip label="Tag 3" />
</Row>

// Row chiếm width cố định
<Row style={{ width: 360, height: 48, backgroundColor: '#f0f0f0' }}
  mainAxisAlignment="center"
>
  <Text text="Centered in row" style={{ fontSize: 16 }} />
</Row>
```

> **Lưu ý**: `mainAxisAlignment` là alias cho `justifyContent`, `crossAxisAlignment` cho `alignItems`. Cả hai là shorthand props — không thuộc `style`.
