# useScrollPhysics Hook

## Mục đích
- Gắn công cụ vật lý mô phỏng (Scroll Physics) vào cho vùng Scroll (màn hình, ScrollView, ListView).
- Giả lập gia tốc chạm vuốt (momentum/velocity), kháng lực bật nảy (bouncing của iOS) và kìm hãm (clamping của Android).

## API Documentation

```tsx
import { useScrollPhysics } from 'react-native-skia-kit/hooks';

function ScrollView({ height, horizontal, children }) {
  const contentHeight = 1200; // Đo từ layout
  
  const { scrollOffset, handlePanUpdate, handlePanEnd, scrollTo } = useScrollPhysics(
    'bouncing', // 'bouncing' | 'clamping'
    {
      viewportSize: height, 
      contentSize: contentHeight 
    }
  );

  // handlePanUpdate(delta) — gọi khi đang kéo
  // handlePanEnd(velocity) — gọi khi thả tay
  // scrollTo(offset) — scroll programmatically

  return (
    <Group transform={[{ translateY: -scrollOffset.value }]}>
      {/* Skia Content */}
      {children}
    </Group>
  );
}
```

## Chức năng
1. **Lưu trữ trạng thái cuộn:** `scrollOffset` là một `SharedValue` từ Reanimated, đảm bảo không bị re-render liên tục trên UI thread khi cuộn.
2. **Handle Pan:** hook sẽ trả về hàm tính toán `handlePan` đăng ký sẵn với Event Store/Gesture Arena, khi cử chỉ vuốt được hệ thống xác nhận, hook tự cập nhật `scrollOffset`.
3. **Simpsons rule & Damping:** Nếu chế độ là `bouncing`, sau khi vuốt thả tay (Fling) hệ thống tự trượt và bật ngược lại nhờ Simulation Toán học.

## Thuật toán
Dựa trên Reanimated `withDecay` và `withSpring` để tạo simulation:
- `Clamping:` Giới hạn mốc từ `0` đến `(contentSize - viewportSize)`. Kéo quá mốc lập tức bị cản cứng (velocity = 0).
- `Bouncing:` Giới hạn từ `0` đến `maxScroll`, nhưng cho phép kéo vượt mốc 1 lúc, thả ra `withSpring` để đàn hồi lại.
