# Box

Container cơ bản — base component cho hầu hết component khác. Tương đương Flutter `Container` / `DecoratedBox`.

## Interface

```ts
type BoxStyle = LayoutStyle & SpacingStyle & ColorStyle & BorderStyle
  & ShadowStyle & FlexChildStyle & FlexContainerStyle;

interface BoxProps {
  x?: number;
  y?: number;
  style?: BoxStyle;
  hitTestBehavior?: HitTestBehavior;
  onPress?: () => void;
  onLongPress?: () => void;
  onPanStart?: (e: PanEvent) => void;
  onPanUpdate?: (e: PanEvent) => void;
  onPanEnd?: (e: PanEvent) => void;
  onLayout?: (layout: LayoutRect) => void;
  accessibilityLabel?: string;
  children?: React.ReactNode;
}
```

## Cách dùng

### Layout cơ bản
```tsx
<Column x={0} y={0} style={{ width: 360, height: 800, gap: 12, padding: 16 }}>
  <Box style={{ height: 50, backgroundColor: 'red' }} />
  <Box style={{ height: 80, backgroundColor: 'blue' }} />
  <Box style={{ flex: 1, backgroundColor: 'green' }} />
</Column>
```

### Row layout — spaceBetween
```tsx
<Box style={{
  flexDirection: 'row',
  justifyContent: 'spaceBetween',
  alignItems: 'center',
  padding: 16,
}}>
  <Text text="Title" style={{ fontSize: 20, fontWeight: 'bold' }} />
  <Icon name="menu" size={24} />
</Box>
```

### Card-style box
```tsx
<Box style={{
  height: 72,
  borderRadius: 12,
  backgroundColor: 'white',
  elevation: 2,
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  gap: 10,
}}>
  <Box style={{
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F0FE',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <Icon name="menu" size={20} color="#1A73E8" />
  </Box>
  <Column style={{ flex: 1 }} mainAxisAlignment="center">
    <Text text="Danh sách hóa đơn" style={{ fontSize: 13, fontWeight: '600' }} />
  </Column>
</Box>
```

### Event handling
```tsx
<Box
  style={{ height: 48, backgroundColor: '#1A73E8', borderRadius: 8 }}
  hitTestBehavior="opaque"
  onPress={() => console.log('Pressed!')}
/>
```

## Layout Model
- Box là **greedy** (mặc định stretch cross-axis)
- Trong Column parent: width = parent width, height cần set hoặc `flex`
- Trong Row parent: height = parent height, width cần set hoặc `flex`
- Constraints go down → Sizes go up → Parent sets position
