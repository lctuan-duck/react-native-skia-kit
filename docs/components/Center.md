# Center / Align

Căn giữa (hoặc căn theo vị trí) child. Tương đương Flutter `Center` / `Align`.

## Interface

```ts
type CenterStyle = FlexChildStyle & { width?: number; height?: number; };

interface CenterProps {
  x?: number; y?: number;
  style?: CenterStyle;
  children: React.ReactNode;
}

interface AlignProps extends CenterProps {
  alignment?: AlignmentValue;
  // 'topLeft' | 'topCenter' | 'topRight' | 'centerLeft' | 'center' | 'centerRight'
  // | 'bottomLeft' | 'bottomCenter' | 'bottomRight'
}
```

## Cách dùng

```tsx
<Center style={{ width: 360, height: 360 }}>
  <Text text="Centered!" style={{ fontSize: 24 }} />
</Center>

<Align alignment="bottomRight" style={{ width: 360, height: 360 }}>
  <Button text="FAB" variant="fab" />
</Align>
```
