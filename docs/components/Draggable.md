# Draggable

Kéo thả element. Tương đương Flutter `Draggable`.

## Interface

```ts
interface DraggableProps {
  children: React.ReactNode;
  width?: number; height?: number;
  onDragStart?: () => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
  onDragUpdate?: (pos: { x: number; y: number }) => void;
  feedback?: React.ReactNode;
}
```

## Cách dùng

```tsx
<Draggable width={60} height={60} onDragEnd={(pos) => drop(pos)}>
  <Box style={{ width: 60, height: 60, backgroundColor: 'blue', borderRadius: 8 }} />
</Draggable>
```
