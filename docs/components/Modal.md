# Modal

Dialog overlay căn giữa. Tương đương Flutter `showDialog` / `AlertDialog`.

## Interface

```ts
type ModalStyle = ColorStyle & BorderStyle & ShadowStyle & FlexChildStyle & {
  width?: number;
  height?: number;
};

interface ModalProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  barrierDismissible?: boolean;
  barrierColor?: string;
  style?: ModalStyle;           // width, height, borderRadius, backgroundColor, elevation
  screenWidth?: number;
  screenHeight?: number;
}
```

## Cách dùng

```tsx
<Modal visible={showModal} onClose={() => setShowModal(false)}
  style={{ width: 300, height: 200, borderRadius: 16 }}
>
  <Text text="Dialog content" style={{ fontSize: 16 }} />
  <Button text="OK" onPress={() => setShowModal(false)} />
</Modal>
```

Hoặc dùng function: `showDialog()` — xem [DialogService](../functions/DialogService.md).
