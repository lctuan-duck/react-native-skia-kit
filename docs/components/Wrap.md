# Wrap

Auto-wrapping horizontal flow layout. Tương đương Flutter `Wrap`.

## Interface

```ts
type WrapStyle = FlexChildStyle & { width?: number; };

interface WrapProps {
  x?: number; y?: number;
  style?: WrapStyle;
  spacing?: number;           // horizontal gap
  runSpacing?: number;        // vertical gap between rows
  alignment?: 'start' | 'center' | 'end';
  crossAxisAlignment?: 'start' | 'center' | 'end';
  children?: React.ReactNode;
}
```

## Cách dùng

```tsx
<Wrap style={{ width: 360 }} spacing={8} runSpacing={8}>
  <Chip label="React" />
  <Chip label="TypeScript" />
  <Chip label="Skia" />
  <Chip label="Yoga" />
</Wrap>
```
