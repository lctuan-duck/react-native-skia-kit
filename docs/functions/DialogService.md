# DialogService

Convenience functions cho dialog, bottom sheet, snackbar. Tương đương Flutter `showDialog()`, `showModalBottomSheet()`, `ScaffoldMessenger.showSnackBar()`.

## showDialog

```ts
interface DialogOptions {
  id?: string;
  title?: string;
  content?: string | React.ReactNode;
  width?: number;
  height?: number;
  barrierDismissible?: boolean;
  actions?: { label: string; onPress?: () => void; variant?: ButtonVariant; }[];
  screenWidth?: number;
  screenHeight?: number;
}

function showDialog(options: DialogOptions): () => void;  // returns dismiss fn
```

```tsx
const dismiss = showDialog({
  title: 'Delete item?',
  content: 'This action cannot be undone.',
  actions: [
    { label: 'Cancel', variant: 'ghost', onPress: () => dismiss() },
    { label: 'Delete', variant: 'solid', onPress: () => { deleteItem(); dismiss(); } },
  ],
});
```

## showBottomSheet

```ts
interface BottomSheetOptions {
  id?: string;
  children: React.ReactNode;
  sheetHeight?: number;
  showHandle?: boolean;
  screenWidth?: number;
  screenHeight?: number;
}

function showBottomSheet(options: BottomSheetOptions): () => void;
```

## showSnackBar

```ts
interface SnackBarOptions {
  id?: string;
  message: string;
  duration?: number;             // default: 3000ms
  actionLabel?: string;
  onAction?: () => void;
  screenWidth?: number;
  screenHeight?: number;
}

function showSnackBar(options: SnackBarOptions): () => void;
```

> **Lưu ý**: Các function này dùng `overlayStore` nội bộ. Modal/BottomSheet sử dụng `style` prop cho visual properties (width, height, borderRadius...).
