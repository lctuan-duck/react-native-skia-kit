# Kế hoạch Tối ưu hóa UI Thread Rendering cho CanvasRoot

## Tình trạng hiện tại (Nguyên nhân gây giật lag)
Hiện tại, `react-native-skia-kit` đang sử dụng cơ chế bridge-hopping (nhảy luồng) để vẽ (render) các khung hình animation:
1. Reanimated Worklet tính toán animation ở **UI Thread**.
2. Worklet gọi C++ Engine (`uiEngine.updateAnimatedStyles`) để cập nhật layout.
3. UI Thread gọi `runOnJS` để báo cho **JS Thread** biết cần vẽ lại.
4. JS Thread gọi hàm C++ `getRootPicture` để lấy mảng byte (ArrayBuffer), sau đó dùng `Skia.Picture.MakePicture(bytes)` để tạo `SkPicture`.
5. JS Thread gọi React `setState` để cập nhật prop `picture` cho `SkiaPictureView`.

**Nhược điểm:**
- JS Thread bị nghẽn (flooded) do phải xử lý hàng trăm request `setState` và JNI calls mỗi giây.
- Bị rớt khung hình (drop frames) nếu JS Thread đang bận xử lý logic của app.
- Chậm trễ do chi phí Serialize/Deserialize Picture liên tục.

---

## Giải pháp tối ưu: UI Thread Rendering Tuyệt Đối
Mục tiêu là loại bỏ hoàn toàn bước 3, 4, 5 ở trên. Chúng ta sẽ làm cho UI Thread tự động lấy buffer từ C++ và tự vẽ lên màn hình mà không cần "đánh thức" JS Thread hay React.

### Các bước thực hiện thay đổi trên `CanvasRoot.tsx`

#### Bước 1: Thay thế `SkiaPictureView` bằng `Canvas` và `Picture`
Thư viện `@shopify/react-native-skia` hỗ trợ truyền một `SharedValue<SkPicture>` vào thẻ `<Picture>`. Nhờ vậy, ta không cần dùng React State nữa.

```tsx
// Xoá: import { SkiaPictureView, Skia } from '@shopify/react-native-skia';
// Thêm:
import { Canvas, Picture, Skia } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
```

#### Bước 2: Tạo Trigger `SharedValue` để báo hiệu vẽ lại
Thay vì dùng `skiaKitScrollRedraw` để đẩy việc sang JS Thread, chúng ta dùng nó để tăng một biến đếm (counter) ngay trên UI Thread.

```tsx
// Tạo trigger trên JS
const redrawTrigger = useSharedValue(0);

// Khai báo trong runOnUI:
(global as any).skiaKitScrollRedraw = () => {
  'worklet';
  redrawTrigger.value += 1; // Kích hoạt vẽ lại ngay lập tức trên UI Thread
};
```

#### Bước 3: Đưa logic Parse Picture vào `useDerivedValue` (UI Thread)
Reanimated `useDerivedValue` chạy trực tiếp trên UI Thread. Nó sẽ lắng nghe sự thay đổi của `redrawTrigger` và trả về `SkPicture` mới.

```tsx
const pictureSV = useDerivedValue(() => {
  // Lắng nghe trigger
  const tick = redrawTrigger.value;
  
  const engine = boxedEngine.unbox();
  if (!engine) return null;

  // Lấy buffer trực tiếp từ C++ (chạy ở UI Thread)
  const buffer = engine.getRootPicture(canvasId, screenWidth, screenHeight);
  
  if (buffer && buffer.byteLength > 100) {
    return Skia.Picture.MakePicture(new Uint8Array(buffer));
  }
  
  return null;
}, [screenWidth, screenHeight, canvasId]);
```

#### Bước 4: Cập nhật cây Component Render
Thay vì dùng `SkiaPictureView`, hãy bọc `<Picture>` bên trong `<Canvas>`.

```tsx
<WidgetContext.Provider value={canvasId}>
  <RNGestureDetector gesture={gesture}>
    <Canvas style={[{ flex: 1, width: screenWidth, height: screenHeight }, style]}>
      {/* Truyền trực tiếp SharedValue vào Picture */}
      <Picture picture={pictureSV as any} />
    </Canvas>
  </RNGestureDetector>
</WidgetContext.Provider>
```

---

## Kết quả đạt được
- **Zero JS Bridge Traffic**: Không còn dữ liệu bị nghẽn giữa 2 luồng.
- **Zero React Re-render**: React sẽ chỉ render đúng 1 lần lúc mount. Toàn bộ quá trình animation được chạy "ngầm" dưới C++ và GPU.
- **Native 60fps/120fps**: Tận dụng tối đa sức mạnh của Reanimated và Skia Worklet, mượt mà tương đương Flutter hoặc Native nguyên thủy.
