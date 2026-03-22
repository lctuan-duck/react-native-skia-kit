# Phase 8: Animation Controller (Reanimated)

## Checklist
- [x] Dùng useSharedValue để điều khiển thuộc tính Skia (scale, opacity...)
- [x] Chỉ re-render khi giá trị thay đổi qua useDerivedValue
- [x] Tích hợp animation cho các widget (Button, Box...)
- [x] Kết hợp với Gesture Arena cho animation tương tác

## Steps
1. Tích hợp react-native-reanimated vào project
2. Định nghĩa useSharedValue cho các thuộc tính động (scale, opacity...)
3. Khi có sự kiện (onPress, onChange), cập nhật giá trị SharedValue
4. Dùng useDerivedValue để trigger re-render Skia

## Smart Re-render với Animation
useDerivedValue là tầng thứ 3 trong hệ thống dirty checking:

```ts
// Tầng 1: Zustand selector (chỉ re-render khi layout này thay đổi)
const layout = useLayoutStore((state) => state.layoutMap.get(widgetId));

// Tầng 2: React.memo (chặn re-render khi props không đổi)
export const AnimatedBox = React.memo(function AnimatedBox(props) { ... });

// Tầng 3: useDerivedValue (chỉ re-render Skia khi animated value thay đổi)
const derivedScale = useDerivedValue(() => scale.value);
const derivedOpacity = useDerivedValue(() => opacity.value);
```

## Kết hợp Animation + Gesture Arena
Khi gesture thắng arena → trigger animation:
```ts
class TapRecognizer implements GestureArenaMember {
  acceptGesture(pointerId: number) {
    // Gesture thắng → trigger animation
    withSpring(scale, { toValue: 0.95 }); // press effect
    widget.callbacks.onPress?.();
  }
  rejectGesture(pointerId: number) {
    // Gesture thua → reset animation
    withSpring(scale, { toValue: 1 });
  }
}
```

## Thuật toán/Logic
- Mỗi widget có thể nhận các props động (scale, opacity, translate, rotate...)
- Khi có sự kiện (onPress, onChange, gesture), cập nhật giá trị SharedValue cho widget
- Dùng useDerivedValue để theo dõi giá trị SharedValue, trigger re-render cho widget đó
- Khi render, truyền giá trị động vào props Skia (ví dụ: scale, opacity)
- Chỉ vẽ lại widget bị ảnh hưởng, không re-render toàn bộ cây
- Kết hợp với layoutMap để đảm bảo vị trí và kích thước đúng khi animation xảy ra
- Kết hợp với Gesture Arena để tạo hiệu ứng tương tác (nhấn, kéo, thả)

## Nguồn tham khảo
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Flutter Animation](https://docs.flutter.dev/development/ui/animations)
