# Overlay

Backdrop bán trong suốt. Dùng nội bộ bởi Modal, BottomSheet, Drawer.

## Interface

```ts
interface OverlayProps {
  visible?: boolean;
  onPress?: () => void;
  barrierColor?: string;         // default: 'rgba(0,0,0,0.5)' — nhận rgba string
  screenWidth?: number;
  screenHeight?: number;
}
```

## Cách dùng

```tsx
<Overlay visible barrierColor="rgba(0,0,0,0.5)" onPress={handleDismiss} />
```
