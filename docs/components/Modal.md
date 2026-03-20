# Modal Component

## Mục đích
- Popup/dialog overlay lên UI, hỗ trợ animation.

## Flutter tương đương
- `showDialog`, `AlertDialog`, `showModalBottomSheet`

## TypeScript Interface

```ts
interface ModalProps extends WidgetProps {
  visible?: boolean;         // default: false
  x?: number;
  y?: number;
  width?: number;            // default: 280
  height?: number;           // default: 200
  borderRadius?: number;     // default: 16
  backgroundColor?: string;  // default: 'white'
  onClose?: () => void;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `visible` | `boolean` | `false` | ❌ | Hiển thị modal |
| `x` | `number` | — | ❌ | Vị trí X dialog |
| `y` | `number` | — | ❌ | Vị trí Y dialog |
| `width` | `number` | `280` | ❌ | Chiều rộng |
| `height` | `number` | `200` | ❌ | Chiều cao |
| `borderRadius` | `number` | `16` | ❌ | Bo góc |
| `backgroundColor` | `string` | `theme.surface` | ❌ | Màu nền |
| `onClose` | `() => void` | — | ❌ | Đóng modal |
| `children` | `ReactNode` | — | ❌ | Nội dung dialog |

## Kiến trúc: Composition (Tái sử dụng Overlay + Box)

> **Modal KHÔNG vẽ Skia nguyên thủy.** 
> Modal = Một `<Overlay>` làm nền mờ (chặn tap) + Một `<Box>` thiết lập mặc định làm dialog box nổi bật ở giữa màn hình.

## Core Implementation

```tsx
import { Group } from '@shopify/react-native-skia';
import { Overlay, Box } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit/hooks';

export function Modal({
  visible = false,
  x, y,
  width = 280, height = 200,
  borderRadius = 16,
  backgroundColor,        // undefined → theme.colors.surface
  onClose,
  children,
}) {
  if (!visible) return null;
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.surface;

  // Modal luôn được render cuối cùng trong CanvasRoot tree
  // nên tự động nằm trên tất cả content khác
  return (
    <Group>
      {/* Dim overlay — tái sử dụng Base Component Overlay */}
      <Overlay 
        visible={visible} 
        color="rgba(0,0,0,0.5)" 
        onPress={onClose} 
      />

      {/* Dialog box — tái sử dụng Box */}
      <Box
        x={x} y={y}
        width={width} height={height}
        borderRadius={borderRadius}
        color={bgColor}
        elevation={24}  // Nổi hẳn lên cao nhất
        hitTestBehavior="opaque" // Chặn click xuyên xuống dưới Overlay
      >
        {/* Content bên trong */}
        {children}
      </Box>
    </Group>
  );
}
```

## Cách dùng (trong CanvasRoot)
```tsx
<CanvasRoot>
  {/* Screen content... */}
  <Button x={16} y={200} text="Mở modal" onPress={() => setShow(true)} />

  {/* Modal luôn đặt ở cuối — vẽ on top */}
  <Modal
    visible={show}
    x={40} y={200}
    width={280} height={200}
    onClose={() => setShow(false)}
  >
    <Text x={56} y={220} text="Xác nhận?" fontSize={18} />
    <Button x={56} y={340} width={100} text="OK" onPress={confirm} />
  </Modal>
</CanvasRoot>
```

## Links
- Base: [Overlay.md](./Overlay.md), [Box.md](./Box.md)
- Store: [overlay-store.md](../store-design/overlay-store.md), [event-store.md](../store-design/event-store.md)
- Related: [Drawer.md](./Drawer.md), [Tooltip.md](./Tooltip.md)
