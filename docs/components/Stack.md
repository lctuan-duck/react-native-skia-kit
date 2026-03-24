# Stack / Positioned

Chồng children lên nhau (z-axis). Tương đương Flutter `Stack` + `Positioned`.

## Interface

```ts
type StackStyle = FlexChildStyle & { width?: number; height?: number; };

interface StackProps {
  x?: number; y?: number;
  style?: StackStyle;
  clipToBounds?: boolean;
  children?: React.ReactNode;
}

interface PositionedProps {
  style?: FlexChildStyle & { width?: number; height?: number; };
  children: React.ReactNode;
}
```

## Cách dùng

```tsx
<Stack style={{ width: 200, height: 200 }}>
  <Box style={{ width: 200, height: 200, backgroundColor: 'blue' }} />
  <Positioned style={{ position: 'absolute', top: 10, left: 10 }}>
    <Badge variant="dot" color="error" />
  </Positioned>
</Stack>
```
