# Kế hoạch Kiến trúc Hệ thống Skia Animation Toàn Diện (Ultimate Animation System)

Tài liệu đặc tả kỹ thuật chi tiết nhất, chia nhỏ công việc thành 3 giai đoạn (Phases) để đảm bảo an toàn cho kiến trúc C++ Engine.

---

## 🚀 Phase 1: Core Transform & Cầu Nối JS-C++ (Nền tảng của vạn vật)
**Mục tiêu:** Mở khóa khả năng co giãn (Scale), dịch chuyển (Translate), xoay (Rotate) và Opacity cho TẤT CẢ các component mà không gây Layout Shift. Đồng thời xây dựng hàm Worklet Hook ở JS.

### 1.1. Khai báo kiểu dữ liệu (JSI / TypeScript)
**File:** `src/nitro/UIEngine.nitro.ts`
- Cập nhật interface `NativeAnimatedStyle` chứa các tham số chuyển động.
```typescript
export interface NativeAnimatedStyle {
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  rotateZ?: number;
}
// Thêm API vào UIEngine:
updateAnimatedStyles(id: string, style: NativeAnimatedStyle): void;
```

### 1.2. Cập nhật RenderNode (C++)
**Files:** `cpp/core/RenderNode.hpp` & `cpp/core/RenderNode.cpp`
- Bổ sung các biến thành viên lưu Transform Matrix.
```cpp
// RenderNode.hpp
float _scaleX = 1.0f, _scaleY = 1.0f;
float _translateX = 0.0f, _translateY = 0.0f;
float _rotateZ = 0.0f; // Radians
```
- Sửa đổi hàm `RenderNode::paint(SkCanvas* canvas)` để tính toán tâm (Center Origin) và áp dụng Transform trước khi gọi `draw()`.
```cpp
// RenderNode.cpp (Bên trong hàm paint, trước draw)
float centerX = _cachedW * 0.5f;
float centerY = _cachedH * 0.5f;
canvas->translate(x + centerX + _translateX, y + centerY + _translateY);
if (_rotateZ != 0.0f) canvas->rotate(_rotateZ * 180.0f / M_PI); // Skia dùng degrees
canvas->scale(_scaleX, _scaleY);
canvas->translate(-centerX, -centerY);
```

### 1.3. Triển khai Hook Tái Sử Dụng ở JS
**File:** `src/hooks/useSkiaAnimatedStyle.ts`
- Một hook nhận callback trả về `NativeAnimatedStyle` và tự động call C++ Engine mỗi khi Shared Value thay đổi.
```typescript
export function useSkiaAnimatedStyle(id: string, updater: () => NativeAnimatedStyle) {
  useAnimatedReaction(
    updater,
    (result) => {
      'worklet';
      uiEngine.updateAnimatedStyles(id, result);
    },
    [id]
  );
}
```

---

## 🎨 Phase 2: Nâng cấp Visual BoxNode (Góc bo, Viền, Bóng đổ)
**Mục tiêu:** Cho phép animate `borderRadius` từng góc, `borderStyle` (nét đứt) và hiệu ứng `shadow` mượt mà cho `<Box>`.

### 2.1. Nâng cấp NativeBoxProps
**File:** `src/nitro/UIEngine.nitro.ts`
```typescript
export interface NativeBoxProps {
  // Đổi borderRadius đơn thành 4 góc riêng biệt
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomRightRadius?: number;
  borderBottomLeftRadius?: number;
  
  // Bổ sung Border Style (Solid, Dashed)
  borderStyle?: string; 
  dashLength?: number;
  dashSpacing?: number;
  
  // Bổ sung Shadow
  shadowColor?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
}
```

### 2.2. Xử lý vẽ Shadow và Nét viền ở BoxNode C++
**File:** `cpp/core/BoxNode.hpp` & `cpp/core/BoxNode.cpp`
- Cập nhật hàm `draw()` để sử dụng `SkMaskFilter::MakeBlur` cho Shadow (tách khỏi `elevation` gốc của Android để JS toàn quyền điều khiển).
- Thêm `SkDashPathEffect` cho `SkPaint` của Border nếu `borderStyle == "dashed"`.
- Cập nhật lại logic clip path để tính toán 4 góc borderRadius riêng biệt bằng `SkRRect`.

---

## 🌈 Phase 3: Shaders, Gradients & Glassmorphism (Vũ khí Tối Thượng)
**Mục tiêu:** Đưa BoxNode thành một "Canvas Mini" có khả năng render Gradient và Blur.

### 3.1. Hỗ trợ Gradients
**File:** `cpp/core/BoxNode.hpp`
- Thêm cấu trúc `GradientProps` lưu mảng màu (`std::vector<SkColor>`), vị trí điểm dừng (`std::vector<SkScalar>`), và định vị gradient.
- Trong `draw()`, sử dụng `SkGradientShader::MakeLinear`, `SkGradientShader::MakeRadial` truyền vào `bgPaint.setShader(...)`. Bằng cách này JS chỉ cần gửi mảng tọa độ xuống là C++ vẽ Gradient ngay lập tức.

### 3.2. Hỗ trợ Backdrop Blur (Glassmorphism)
**File:** `cpp/core/BoxNode.hpp`
- Thêm tham số `backdropBlurRadius`.
- Trước khi vẽ BoxNode, gọi `canvas->saveLayer()` với `SkImageFilter::MakeBlur` để lấy ảnh nền làm mờ đi rồi vẽ lót bên dưới Background (với điều kiện `backgroundColor` có Alpha < 255).
- Đây là kĩ thuật tạo hiệu ứng kính mờ (frosted glass) chuẩn của Apple.

### 3.3. Color Filters / Blend Modes
- Thêm tham số `colorFilter` (để truyền Matrix màu như đổi tông Grayscale, Sepia).
- Áp dụng `SkColorFilters::Matrix` vào Paint.
