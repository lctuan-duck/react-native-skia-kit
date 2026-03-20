# Overlay Component

## Mục đích
- Lớp phủ bán trong suốt (dim), thường dùng kèm Modal/Drawer.

## Flutter tương đương
- `ModalBarrier`, `GestureDetector` (dùng làm backdrop)

## Kiến trúc: Composition (Tái sử dụng Box)

> **Overlay KHÔNG vẽ Skia nguyên thủy.**
> Overlay = `<Box>` phủ toàn màn hình với `hitTestBehavior="translucent"` — nhận tap VÀ cho phép layer phía trên (Modal/Drawer) cũng nhận event.

## TypeScript Interface

```ts
interface OverlayProps extends WidgetProps {
  visible?: boolean;         // default: false
  color?: string;            // default: 'rgba(0,0,0,0.5)'
  screenWidth?: number;      // default: Dimensions.get('window').width
  screenHeight?: number;     // default: Dimensions.get('window').height
  onPress?: () => void;      // tap outside to close
  hitTestBehavior?: HitTestBehavior; // default: 'translucent'
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `visible` | `boolean` | `false` | ❌ | Hiển thị overlay |
| `color` | `string` | `'rgba(0,0,0,0.5)'` | ❌ | Màu dim |
| `screenWidth` | `number` | window width | ❌ | Chiều rộng phủ |
| `screenHeight` | `number` | window height | ❌ | Chiều cao phủ |
| `onPress` | `() => void` | — | ❌ | Tap để đóng |

## Core Implementation (Composition + Store)

```tsx
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';

export const Overlay = React.memo(function Overlay({
  visible = false,
  color = 'rgba(0,0,0,0.5)',
  screenWidth,
  screenHeight,
  onPress,
}: OverlayProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const w = screenWidth ?? winW;
  const h = screenHeight ?? winH;

  // === Hook thay thế boilerplate ===
  const widgetId = useWidget<{ visible: boolean; color: string }>({
    type: 'Overlay',
    layout: { x: 0, y: 0, width: w, height: h },
    props: { visible, color },
  });

  useHitTest(widgetId, {
    rect: { left: 0, top: 0, width: w, height: h },
    callbacks: { onPress },
    behavior: 'translucent',
    zIndex: 90,
  });

  if (!visible) return null;

  return (
    <Box
      x={0} y={0}
      width={w} height={h}
      color={color}
      hitTestBehavior="translucent"
      onPress={onPress}
    />
  );
});
```

## Cách dùng

### Với Drawer
```tsx
<CanvasRoot>
  {/* Screen content... */}

  {/* Overlay đặt TRƯỚC Drawer trong cây render */}
  <Overlay visible={drawerOpen} onPress={() => setDrawerOpen(false)} />

  {/* Drawer đặt SAU Overlay — vẽ đè lên trên */}
  <Drawer visible={drawerOpen} width={280}>
    <Text x={16} y={32} text="Menu" fontSize={20} fontWeight="bold" />
  </Drawer>
</CanvasRoot>
```

### Với Modal
```tsx
{/* Modal tự bao gồm Overlay bên trong */}
<Modal visible={show} onClose={() => setShow(false)}>
  <Text x={56} y={220} text="Xác nhận?" fontSize={18} />
</Modal>
```

## HitTestBehavior
- Mặc định: **`translucent`** — nhận tap (để gọi onPress đóng) VÀ cho phép widget phía trên (Modal dialog, Drawer) cũng nhận event.
- Xem chi tiết: [event-store.md](../store-design/event-store.md)

## Links
- Base: [Box.md](./Box.md)
- Store: [overlay-store.md](../store-design/overlay-store.md), [event-store.md](../store-design/event-store.md)
- Used by: [Modal.md](./Modal.md), [Drawer.md](./Drawer.md)
- Integration: [integration.md](../store-design/integration.md)
