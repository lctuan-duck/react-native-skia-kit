# GestureDetector

Bọc children với gesture recognition. Tương đương Flutter `GestureDetector`.

## Interface

```ts
interface GestureDetectorProps {
  children: React.ReactNode;
  width?: number;                // hit test zone
  height?: number;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPanStart?: (e: PanEvent) => void;
  onPanUpdate?: (e: PanEvent) => void;
  onPanEnd?: (e: PanEvent) => void;
  hitTestBehavior?: HitTestBehavior;
}
```

## Cách dùng

```tsx
<GestureDetector width={200} height={200} onTap={() => alert('Tapped!')}>
  <Box style={{ width: 200, height: 200, backgroundColor: 'blue' }} />
</GestureDetector>
```
