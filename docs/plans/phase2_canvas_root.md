# Phase 2: Canvas Root

## Nguyên tắc kiến trúc cốt lõi

> **CHỈ CÓ MỘT `<Canvas>` duy nhất trên toàn bộ màn hình.**
> Tất cả components (Box, Text, Button...) là các **Skia node** (Group, Rect, Path...) vẽ vào Canvas chung này — không tạo Canvas riêng.

```
App
└── CanvasRoot (<Canvas> — DUY NHẤT)
    └── Screen (Group)
        ├── Box         → <Group><RoundedRect/></Group>
        │   ├── Text    → <Paragraph/>
        │   └── Button  → <Group><RoundedRect/><Paragraph/></Group>
        ├── ScrollView  → <Group transform={[{translateY: -offset}]}>
        └── Modal       → <Group> (z-index cao, opacity overlay)
```

## Tại sao KHÔNG tạo nhiều Canvas?

- Mỗi `<Canvas>` = một **GPU surface riêng** = tốn bộ nhớ GPU
- Các Canvas không share draw context → không compositing được
- React Native Skia thiết kế để mọi UI render trên **1 surface duy nhất**
- Skia nodes (`Group`, `Rect`, `Path`, `Paragraph`...) nest vào nhau **miễn phí**

## Ngoại lệ: Khi nào được tạo Canvas thứ 2?

| Trường hợp | Giải pháp |
|-----------|----------|
| Modal / Overlay | `Group` với zIndex cao **trong cùng Canvas** |
| Navigation transition | `Group` + opacity animation trong Canvas |
| Input component | Native `TextInput` ẩn + Skia UI vẽ vào Canvas gốc |
| Portal / absolute overlay toàn app | Canvas thứ 2 với `position: absolute` đè lên (chấp nhận được vì ít xảy ra) |

## Checklist
- [ ] Tạo `CanvasRoot` component chứa `<Canvas>` phủ toàn màn hình
- [ ] `<Canvas>` nhận toàn bộ Skia tree của screen làm children
- [ ] Tích hợp với `layoutStore` để lấy layout đã tính từ Yoga
- [ ] Xử lý `onTouch` ở Canvas → forward vào `eventStore` (Gesture Arena)

## Steps

### 1. CanvasRoot component
```tsx
import { Canvas } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';

export function CanvasRoot({ children }) {
  const { width, height } = useWindowDimensions();

  return (
    <Canvas
      style={{ width, height }}
      onTouch={(e) => eventStore.handleTouch(e)}
    >
      {/* Tất cả UI là Skia nodes bên trong đây */}
      {children}
    </Canvas>
  );
}
```

### 2. Screen sử dụng
```tsx
// Chỉ có 1 Canvas cho toàn bộ screen
function HomeScreen() {
  return (
    <CanvasRoot>
      <Box x={16} y={100} width={360} height={200} color="white">
        <Text x={16} y={120} text="Xin chào" fontSize={24} color="black" />
        <Button x={16} y={180} width={120} height={48} text="Nhấn" onPress={...} />
      </Box>
      <ScrollView x={0} y={320} width={360} height={400}>
        <ListView data={items} renderItem={...} />
      </ScrollView>
    </CanvasRoot>
  );
}
```

## Thuật toán/Logic
- `CanvasRoot` là entry point duy nhất cho toàn bộ UI Skia
- Nhận touch events → dispatch vào `eventStore` → Gesture Arena xử lý
- Layout được tính bởi Yoga (bên ngoài Canvas), kết quả inject vào props (x, y, width, height)
- Dirty checking: khi `layoutStore` thay đổi → các component đọc layout mới → Canvas re-render

## Nguồn tham khảo
- [React Native Skia Canvas API](https://shopify.github.io/react-native-skia/docs/canvas/)
- [Flutter Architectural Overview](https://docs.flutter.dev/resources/architectural-overview)
