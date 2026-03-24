# SnackBar

Thông báo tạm thời ở dưới cùng. Tương đương Flutter `SnackBar`.

## Interface

```ts
type SnackBarStyle = ColorStyle & FlexChildStyle;

interface SnackBarProps {
  message: string;
  variant?: 'standard' | 'error' | 'success';
  color?: SemanticColor;         // default: 'neutral'
  action?: { label: string; onPress: () => void; };
  style?: SnackBarStyle;
  screenWidth?: number;
  screenHeight?: number;
}
```

## Cách dùng

```tsx
<SnackBar message="Item deleted" action={{ label: 'Undo', onPress: handleUndo }} />
<SnackBar message="Error occurred" color="error" />
```

Hoặc dùng function: xem [DialogService](../functions/DialogService.md).
