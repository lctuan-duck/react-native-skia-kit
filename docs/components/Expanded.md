# Expanded / Flexible

Chiếm không gian còn lại trong Row hoặc Column. Tương đương Flutter `Expanded` / `Flexible`.

## Interface

```ts
type ExpandedStyle = FlexChildStyle;

interface ExpandedProps {
  x?: number; y?: number;
  style?: ExpandedStyle;
  children?: React.ReactNode;
}

interface FlexibleProps extends ExpandedProps {
  fit?: 'tight' | 'loose';  // 'tight' = stretch, 'loose' = fit content
}
```

## Cách dùng

```tsx
<Row style={{ width: 360, height: 48 }}>
  <Box style={{ width: 100, backgroundColor: 'red' }} />
  <Expanded>
    <Box style={{ backgroundColor: 'blue' }} />  {/* fill remaining 260px */}
  </Expanded>
</Row>

// 2 Expanded chia đều
<Row style={{ width: 360 }}>
  <Expanded><Box style={{ backgroundColor: 'red' }} /></Expanded>
  <Expanded><Box style={{ backgroundColor: 'blue' }} /></Expanded>
</Row>
```
