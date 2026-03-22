# DialogService — showDialog / showBottomSheet / showSnackBar

## Mục đích
- Convenience functions để hiện dialog, bottom sheet, snackbar mà **không cần quản lý state `visible`**.
- Gọi hàm → hiện overlay → trả về `dismiss()` để đóng.

## Flutter tương đương
- `showDialog()`, `showModalBottomSheet()`, `ScaffoldMessenger.showSnackBar()`

---

## showDialog

```tsx
import { showDialog } from 'react-native-skia-kit';

const dismiss = showDialog({
  title: 'Xóa item?',
  content: 'Hành động này không thể hoàn tác.',
  actions: [
    { label: 'Hủy', variant: 'text', onPress: () => dismiss() },
    { label: 'Xóa', onPress: () => { deleteItem(); dismiss(); } },
  ],
});
```

### Options

```ts
interface DialogOptions {
  id?: string;
  title?: string;
  content?: string | React.ReactNode;
  width?: number;                   // default: 280
  height?: number;                  // default: 180
  barrierDismissible?: boolean;     // default: true
  actions?: { label: string; onPress?: () => void; variant?: 'filled' | 'text' }[];
  screenWidth?: number;
  screenHeight?: number;
}
```

---

## showBottomSheet

```tsx
import { showBottomSheet } from 'react-native-skia-kit';

const dismiss = showBottomSheet({
  children: <MyContent onDone={() => dismiss()} />,
  sheetHeight: 300,
});
```

### Options

```ts
interface BottomSheetOptions {
  id?: string;
  children: React.ReactNode;
  sheetHeight?: number;       // default: 400
  showHandle?: boolean;       // default: true
  screenWidth?: number;
  screenHeight?: number;
}
```

---

## showSnackBar

```tsx
import { showSnackBar } from 'react-native-skia-kit';

showSnackBar({
  message: 'Item đã xóa',
  actionLabel: 'Hoàn tác',
  onAction: () => undoDelete(),
  duration: 3000,
});
```

### Options

```ts
interface SnackBarOptions {
  id?: string;
  message: string;
  duration?: number;           // default: 3000ms (0 = không tự dismiss)
  actionLabel?: string;
  onAction?: () => void;
  screenWidth?: number;
  screenHeight?: number;
}
```

## Hoạt động nội bộ
- Tất cả dùng `overlayStore.showOverlay()` và `overlayStore.hideOverlay()`
- Mỗi overlay có unique ID (auto-generated hoặc custom)
- SnackBar tự dismiss sau `duration` ms

## Nguồn tham khảo
- [Flutter showDialog](https://api.flutter.dev/flutter/material/showDialog.html)
- [Flutter showModalBottomSheet](https://api.flutter.dev/flutter/material/showModalBottomSheet.html)
