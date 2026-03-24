# BottomSheet

Sheet trượt lên từ dưới. Tương đương Flutter `showModalBottomSheet`.

## Interface

```ts
type BottomSheetStyle = ColorStyle & BorderStyle & ShadowStyle & FlexChildStyle & {
  height?: number;
};

interface BottomSheetProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  barrierColor?: string;
  showHandle?: boolean;
  style?: BottomSheetStyle;     // height, borderRadius, backgroundColor, elevation
  screenWidth?: number;
  screenHeight?: number;
}
```

## Cách dùng

```tsx
<BottomSheet visible={show} onClose={close} style={{ height: 400, borderRadius: 24 }}>
  <ListTile title="Option 1" onPress={select1} />
  <ListTile title="Option 2" onPress={select2} />
</BottomSheet>
```

Hoặc dùng function: `showBottomSheet()` — xem [DialogService](../functions/DialogService.md).
