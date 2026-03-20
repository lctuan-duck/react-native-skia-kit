# CanvasRoot Component

## Mục đích
- Component gốc (Root) của toàn bộ UI Kit.
- KHỞI TẠO Skia Canvas duy nhất cho toàn bộ app để vẽ Skia nodes.
- Quản lý touch events gốc để chuyển giao cho Gesture Arena (trong `eventStore`).
- Render **Overlay layer** (Modal, Tooltip, Drawer nổi) sau cùng.

## Flutter tương đương
- `WidgetsApp`, `MaterialApp` (root widget chứa `Navigator` + `Overlay`)

## Kiến trúc

`CanvasRoot` là thành phần React bao bọc Native `<Canvas>` component của shopify/react-native-skia. Mọi phần tử giao diện Skia (Group, RoundedRect, Paragraph...) đều phải được render như là `children` của component này.

```
App
└── CanvasRoot (<Canvas> — DUY NHẤT)
    ├── {children}       ← UI bình thường
    └── {overlays}       ← Overlay layer (Modal, Tooltip, Toast)
```

## TypeScript Interface

```ts
interface CanvasRootProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onLayout?: (layout: LayoutRect) => void;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `children` | `ReactNode` | — | ✅ | Skia elements con |
| `style` | `ViewStyle` | — | ❌ | Ghi đè width/height |
| `onLayout` | `(layout) => void` | — | ❌ | Layout callback |

## Core Implementation (với Overlay Store)

```tsx
import React from 'react';
import { Canvas } from '@shopify/react-native-skia';
import { Group } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import { useEventStore } from '../store/eventStore';
import { useOverlayStore } from '../store/overlayStore';

export function CanvasRoot({ children, style, onLayout }: CanvasRootProps) {
  const { width, height } = useWindowDimensions();
  const handleTouch = useEventStore((state) => state.handleTouch);

  // Lấy overlays từ overlayStore → render cuối cùng (nổi lên trên)
  const overlays = useOverlayStore((state) => Array.from(state.overlays.values()));
  const sortedOverlays = overlays.sort((a, b) => a.zIndex - b.zIndex);

  return (
    <Canvas
      style={[{ width, height }, style]}
      onTouch={handleTouch}   // Root touch handler → Gesture Arena
    >
      {/* 1. UI bình thường của ứng dụng */}
      {children}

      {/* 2. OVERLAY LAYER — Luôn vẽ nằm trên cùng */}
      {sortedOverlays.map((overlay) => (
        <Group key={overlay.id}>
          {overlay.node}
        </Group>
      ))}
    </Canvas>
  );
}
```

## Giải thích chi tiết
1. **Duy nhất một màn hình Skia (Single Surface):** Để kết xuất (render) 60/120FPS, chúng ta không dùng nhiều thẻ `<Canvas>` lồng nhau (gây tràn bộ nhớ GPU).
2. **Event Tunneling:** Thuộc tính `onTouch` sẽ hứng TẤT CẢ mọi thao tác chạm trên màn hình, lưu vị trí (X, Y) và truyền thẳng vào `eventStore` để xử lý vòng đời vuốt, chạm, thả.
3. **Kích thước mặc định:** Nếu không truyền style cố định, `CanvasRoot` sẽ giãn ra phủ toàn bộ kích thước thiết bị (`useWindowDimensions`).
4. **Overlay Layer:** Tất cả component dùng `overlayStore.showOverlay()` (Tooltip, Dropdown, Toast) sẽ tự động render cuối cùng trong CanvasRoot — nổi lên trên tất cả UI.

## Cách dùng

### Cơ bản
```tsx
import { CanvasRoot, Box, Text, Button } from 'react-native-skia-kit';

function App() {
  return (
    <CanvasRoot>
      <Box x={0} y={0} width={360} height={800} color={theme.colors.background}>
        <Text x={16} y={60} text="Hello Skia Kit" fontSize={24} fontWeight="bold" />
        <Button x={16} y={100} text="Click me" onPress={() => {}} />
      </Box>
    </CanvasRoot>
  );
}
```

### Với Navigation
```tsx
<CanvasRoot>
  <Nav initial="Home">
    <HomeScreen name="Home" />
    <ProfileScreen name="Profile" />
  </Nav>
</CanvasRoot>
```

### Với Modal (overlayStore tự render)
```tsx
<CanvasRoot>
  {/* Content... */}
  <Button x={16} y={200} text="Mở modal" onPress={() => setShow(true)} />

  {/* Modal qua overlayStore — CanvasRoot tự render overlay layer */}
  <Modal visible={show} onClose={() => setShow(false)}>
    <Text x={56} y={220} text="Xác nhận?" fontSize={18} />
  </Modal>
</CanvasRoot>
```

## Links
- Store: [event-store.md](../store-design/event-store.md), [overlay-store.md](../store-design/overlay-store.md)
- Integration: [integration.md](../store-design/integration.md)
- Phase: [phase2_canvas_root.md](../plans/phase2_canvas_root.md)
- Related: [Nav.md](./Nav.md), [Modal.md](./Modal.md), [Overlay.md](./Overlay.md)
