# Kế hoạch Kiến trúc Hệ thống Skia Animation Toàn Diện (Ultimate Animation System)

Tài liệu đặc tả kỹ thuật chi tiết nhất, chia nhỏ công việc thành 3 giai đoạn (Phases) để đảm bảo an toàn cho kiến trúc C++ Engine.

---

## 🚀 Phase 1: Core Transform & Cầu Nối JS-C++ (Nền tảng của vạn vật)
**Mục tiêu:** Mở khóa khả năng co giãn (Scale), dịch chuyển (Translate), xoay (Rotate) và Opacity cho TẤT CẢ các component mà không gây Layout Shift. Đồng thời xây dựng hàm Worklet Hook ở JS.

### 1.1. Khai báo kiểu dữ liệu (JSI / TypeScript)
**File:** `src/nitro/UIEngine.nitro.ts`
- Cập nhật interface `NativeAnimatedStyle` chứa các tham số chuyển động đầy đủ.
```typescript
export interface NativeAnimatedStyle {
  opacity?: number;
  
  // Kích thước & Layout Bounds (Vẽ lại qua Skia, không dính Yoga)
  width?: number;
  height?: number;
  
  // Transform cơ bản
  scale?: number;     // Uniform scale
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  
  // Xoay (Rotation)
  rotateZ?: number;
  rotateX?: number;   // 3D rotation
  rotateY?: number;   // 3D rotation
  
  // Kéo xéo (Skew)
  skewX?: number;
  skewY?: number;
  
  // Phối cảnh & Tâm biến đổi
  perspective?: number;
  transformOriginX?: number; // Đổi tâm (Mặc định center)
  transformOriginY?: number; 
  
  // Màu sắc
  backgroundColor?: number;  // Mã màu HEX ARGB
  
  // Tương tác & Lớp (Layering)
  zIndex?: number;           // Thứ tự vẽ
  pointerEvents?: string;    // 'auto' | 'none' | 'box-none' | 'box-only'
}
// Thêm API vào UIEngine:
updateAnimatedStyles(id: string, style: NativeAnimatedStyle): void;
```

### 1.2. Cập nhật RenderNode (C++)
**Files:** `cpp/core/RenderNode.hpp` & `cpp/core/RenderNode.cpp`
- Bổ sung các biến thành viên lưu Transform Matrix, Origin, và Màu sắc.
```cpp
// RenderNode.hpp
float _scaleX = 1.0f, _scaleY = 1.0f;
float _translateX = 0.0f, _translateY = 0.0f;
float _rotateZ = 0.0f, _rotateX = 0.0f, _rotateY = 0.0f;
float _skewX = 0.0f, _skewY = 0.0f;
float _transformOriginX = -1.0f, _transformOriginY = -1.0f; // -1 nghĩa là dùng center
SkColor _backgroundColor = SK_ColorTRANSPARENT;

// Tương tác và Layer
int _zIndex = 0;
std::string _pointerEvents = "auto";
```
- **Hit Testing**: Thêm logic kiểm tra `_pointerEvents` trong hàm xử lý Touch để quyết định có pass event xuống không.
- **Layering**: Cập nhật hàm `RenderNode::paint(SkCanvas* canvas)`. Trước khi gọi `paint` trên các `childrenNode`, tiến hành sort lại mảng children theo giá trị `_zIndex` (Stable Sort) để đảm bảo các node có zIndex cao hơn sẽ được vẽ sau (nổi lên trên).
- Sửa đổi hàm `RenderNode::paint(SkCanvas* canvas)` để tính toán tâm (Center Origin) và áp dụng Transform trước khi gọi `draw()`. Nếu có 3D Transforms (`rotateX`, `rotateY`), cần sử dụng `SkM44` để tạo ma trận 3D với góc nhìn (perspective).
```cpp
// RenderNode.cpp (Bên trong hàm paint, trước draw)
float originX = (_transformOriginX >= 0) ? _transformOriginX : (_cachedW * 0.5f);
float originY = (_transformOriginY >= 0) ? _transformOriginY : (_cachedH * 0.5f);

canvas->save();
canvas->translate(x + originX + _translateX, y + originY + _translateY);

// Áp dụng Skew
if (_skewX != 0.0f || _skewY != 0.0f) canvas->skew(_skewX, _skewY);

// Áp dụng Rotation (Để đơn giản ví dụ 2D, rotate 3D cần SkM44)
if (_rotateZ != 0.0f) canvas->rotate(_rotateZ * 180.0f / M_PI); 

canvas->scale(_scaleX, _scaleY);
canvas->translate(-originX, -originY);
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

### 1.4. Phân loại Thuộc tính Animation (Paint vs Layout)
Vì hệ thống của chúng ta sử dụng trọn bộ component tự build (Row, Column, Box...) render bằng Skia, engine C++ của chúng ta **chịu trách nhiệm quản lý cả tính toán Flexbox (Yoga) và vẽ (Paint)**. 

Khi một animation chạy qua Worklet và gọi `uiEngine.updateAnimatedStyles`, engine C++ cần phân loại thuộc tính để quyết định xem có cần chạy lại thuật toán Layout hay không:

#### 1. Nhóm Paint-Only (Chỉ vẽ lại - Tốc độ bàn thờ, Không Layout Shift)
Nhóm này chỉ làm thay đổi mặt thị giác, hoàn toàn không đẩy hay kéo các component khác. C++ Engine chỉ việc update biến số và gọi lại lệnh `SkCanvas::draw()`.
*   **Transform & Không gian**: `scale`, `translateX`, `translateY`, `rotate`, `skew`, `transformOrigin`. (Lưu ý: `translate` khác với `top`/`left`, `translate` chỉ dời hình ảnh vẽ đi chỗ khác).
*   **Màu sắc & Thị giác**: `opacity`, `backgroundColor`, `color`, `blendMode`.
*   **Viền & Bóng (Không ảnh hưởng kích thước)**: `borderColor`, `borderRadius`, `borderStyle`, `shadowColor`, `shadowOpacity`, `shadowBlur`, `shadowSpread`.
*   **Layer**: `zIndex`, `pointerEvents`.

#### 2. Nhóm Layout-Affecting (Tuân thủ Flexbox - Bắt buộc chạy lại Yoga)
Nhóm này khi thay đổi sẽ làm thay đổi cấu trúc không gian vật lý của UI. C++ Engine khi nhận diện thuộc tính này thay đổi **BẮT BUỘC** phải gọi `YGNodeStyleSet...` và chạy lại `YGNodeCalculateLayout()` của Yoga C++ trước khi vẽ.
*   **Kích thước (Size)**: `width`, `height`. (Ví dụ: animate `width` của Item A to ra, Yoga sẽ tính toán đẩy Item B nằm cạnh ra xa).
*   **Khoảng cách (Spacing)**: 
    *   Margin (`margin`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`).
    *   Padding (`padding`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`).
*   **Thuộc tính Flex**: `flex`, `flexGrow`, `flexShrink`, `flexBasis`.
*   **Vị trí tuyệt đối/tương đối (Positioning)**: `top`, `bottom`, `left`, `right`.
*   **Độ dày viền**: `borderWidth` (Trong Flexbox chuẩn, độ dày viền sẽ chiếm không gian và bóp nhỏ nội dung bên trong lại).

**👉 Quy tắc vàng khi code UI:** 
*   Luôn ưu tiên dùng **Nhóm 1 (Paint-Only)** cho mọi animation nếu có thể (Ví dụ: dùng `scale` thay vì `width` để phóng to 1 nút bấm). 
*   Chỉ dùng **Nhóm 2 (Layout-Affecting)** khi bạn *thực sự cần* một component đẩy các component khác lùi ra xa (Ví dụ: Mở rộng Accordion menu). Hệ thống vẫn sẽ mượt, nhưng tốn thêm 1 nhịp CPU cho Yoga so với Nhóm 1.

#### 3. Phân tích sâu: Trường hợp dính đến `position: 'absolute'`
Khi thuộc tính Layout-Affecting thay đổi và kích hoạt Yoga, Yoga sẽ tuân thủ tuyệt đối quy tắc của Flexbox:

*   **TH1: Bản thân Item đang animate là `absolute`:**
    *   Item này đã được bóc tách khỏi "luồng Layout" (normal flow).
    *   Nếu bạn animate `width` của item này: Yoga vẫn tính toán lại, Item này to ra, các children bên trong nó được bố trí lại. **Nhưng** các component anh em (siblings) nằm ngoài sẽ KHÔNG bị đẩy (vì item này là absolute). 
    *   *Lời khuyên:* Trong trường hợp này, kết quả hình ảnh giống hệt dùng `scale`. Do đó, nếu item đã là `absolute` và chỉ muốn phóng to, hãy dùng `scaleX/Y` (Nhóm 1) để tiết kiệm nhịp CPU gọi Yoga.

*   **TH2: Item cha (Outer) là `absolute`, Item con (Inner) bên trong animate Layout:**
    *   Giả sử Component Cha là `absolute`. Bên trong nó có Con A và Con B (là flex item bình thường).
    *   Khi bạn animate `width` của Con A: Yoga sẽ chạy. Con A to ra -> **Con B CHẮC CHẮN SẼ BỊ ĐẨY ĐI**. Flexbox bên trong Component Cha vẫn hoạt động hoàn hảo.
    *   Component Cha có to ra không? Nếu Component Cha không bị fix cứng kích thước (`width: auto`), Yoga sẽ làm Component Cha phình to theo để ôm trọn Con A và Con B. 
    *   Sự phình to của Component Cha (absolute) có đẩy các item bên ngoài không? **KHÔNG**. Hiệu ứng đẩy Layout sẽ bị chặn lại và triệt tiêu tại ranh giới của Component Cha (do nó là absolute).
    *   *Kết luận:* Mọi thứ hoạt động cực kỳ chính xác theo logic Flexbox của W3C. Nếu muốn Con B bị đẩy, bắt buộc Con A phải animate `width` (Nhóm 2).

### 1.5. Tối ưu Hiệu năng & An toàn luồng (Critical)
Dù bỏ qua Yoga, việc vẽ bằng Skia vẫn cần 2 cơ chế bắt buộc để đạt đẳng cấp Production:
*   **Dirty Rect Tracking (Quản lý Vùng Vẽ):** Không gọi `canvas->clear()` và vẽ lại toàn bộ màn hình. C++ Engine phải lưu trữ `SkRect` (Bounding box) của node trước và sau khi animate. Khi vẽ lại, chỉ truyền vùng `SkRect` hợp nhất của 2 frame này cho hệ thống để thực hiện Partial Repaint (Vẽ lại một phần), giúp máy mát và tiết kiệm pin.
*   **Thread Synchronization (Đồng bộ luồng):** Worklet chạy trên JS Thread, trong khi Skia vẽ trên Render/UI Thread. Cần triển khai Double-Buffering (hoặc Mutex Lock) để lưu trữ trạng thái cây Node. Điều này tránh việc C++ đang duyệt cây vẽ dở dang thì JS Thread lại nhồi update Transform xuống gây crash/data race.

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
  
  // Cắt cúp (Clipping)
  overflow?: string; // 'visible' | 'hidden'
  
  // Bổ sung Border đầy đủ (Width, Color, Style)
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: number;
  borderTopColor?: number;
  borderRightColor?: number;
  borderBottomColor?: number;
  borderLeftColor?: number;
  borderStyle?: string; 
  dashLength?: number;
  dashSpacing?: number;
  
  // Bổ sung Shadow đầy đủ
  shadowColor?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowOpacity?: number; // Độ mờ của bóng
  shadowSpread?: number;  // Độ lan rộng của bóng
  shadowType?: string;    // 'outer' | 'inner' (Bóng đổ trong/ngoài)
}
```

### 2.1.5. Hỗ trợ hiển thị chữ (TextNode) - Tùy chọn bổ sung
Nếu hệ thống cần vẽ text, cần thiết kế thêm `NativeTextProps` (hoặc nhúng vào `NativeAnimatedStyle`) gồm: `color`, `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`. Skia vẽ text thông qua `SkTextBlob` và `SkFont`. Animate `color` và `letterSpacing` khá dễ, nhưng animate `fontSize` đòi hỏi tạo lại TextBlob.

### 2.2. Xử lý vẽ Shadow và Nét viền ở BoxNode C++
**File:** `cpp/core/BoxNode.hpp` & `cpp/core/BoxNode.cpp`
- **Vẽ Border (Hình thang - Trapezoid):** Khi `borderWidth` và `borderColor` khác nhau ở 4 cạnh, C++ Engine KHÔNG được dùng `SkPaint::setStrokeWidth` (sẽ bị lỗi viền góc). Thay vào đó, phải tự động tính toán và tạo 4 đa giác `SkPath` (hình thang) cho 4 cạnh dựa trên kích thước Box và bán kính `borderRadius`. Vẽ từng `SkPath` với màu riêng biệt để đúng chuẩn CSS.
- **Outer Shadow & Khoét lỗ (Difference Clip):** Áp dụng `SkMaskFilter::MakeBlur` và `shadowSpread`. Đặc biệt: nếu box có màu nền trong suốt (`opacity < 1`), ánh sáng bóng đổ sẽ xuyên thấu. Cần gọi `canvas->clipRRect(box, SkClipOp::kDifference)` để "khoét thủng" phần diện tích bên trong Box, ép Shadow chỉ được tủa ra bên ngoài viền.
- **Inner Shadow:** Nếu `shadowType == "inner"`, sử dụng kĩ thuật clip hình dáng box, vẽ shadow stroke với độ dày lớn để lan vào bên trong tạo hiệu ứng Neumorphism.
- **Overflow & Cắt cúp**: Nếu `overflow == "hidden"`, gọi `canvas->clipRRect()` với 4 góc `borderRadius` riêng biệt trước khi duyệt vẽ các children. Thêm `SkDashPathEffect` nếu `borderStyle == "dashed"`.

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
- Trước khi vẽ BoxNode, gọi `canvas->saveLayer(bounds, paint_with_filter)` với `SkImageFilter::MakeBlur` để lấy ảnh nền làm mờ đi rồi vẽ lót bên dưới Background. (Yêu cầu `backgroundColor` có Alpha < 255).
- **Tối ưu GPU (Sát thủ hiệu năng):** Lệnh `saveLayer` cực kỳ tốn VRAM. BẮT BUỘC phải truyền `bounds` (diện tích của Component) vào hàm `saveLayer`. Nếu truyền NULL, Skia sẽ copy và blur toàn bộ màn hình, dẫn đến sụt giảm FPS nghiêm trọng trên thiết bị yếu. Đây là kĩ thuật tạo hiệu ứng kính mờ (frosted glass) chuẩn.

### 3.3. Color Filters / Blend Modes
- **Color Filter**: Thêm tham số `colorFilter` (để truyền Matrix màu như đổi tông Grayscale, Sepia). Áp dụng thông qua `SkColorFilters::Matrix`.
- **Blend Modes (`mix-blend-mode`)**: Bổ sung tham số `blendMode` để tận dụng `SkBlendMode` của Skia (hỗ trợ Multiply, Screen, Overlay, v.v.). Truyền vào bằng `paint.setBlendMode()`. Đây là tính năng nâng cao giúp các Box đè lên nhau tạo hiệu ứng thị giác tuyệt đỉnh.

---

## 🎬 Phase 4: Shared Element (Hero) Transitions & Layout Animations (Mượt mà cấp độ Flutter)
**Mục tiêu:** Hoàn thiện trải nghiệm chuyển cảnh cao cấp (Hero Transition) giữa các màn hình và tự động hóa chuyển động của Layout khi cấu trúc component thay đổi (Layout Animations) mà không làm suy giảm FPS.

### 4.1. Khắc phục hạn chế của Hero hiện tại
Hiện tại trong [Hero.tsx](file:///d:/WORK/react-native-lib/react-native-skia-kit/src/components/Hero.tsx#L186-L202), component `HeroAnimatedRect` chỉ nhảy ngay lập tức tới tọa độ đích (`to`) mà không có hiệu ứng nội suy (lerp) chuyển động mượt mà. 

**Giải pháp:**
- Sử dụng `uiEngine.updateAnimatedStyles` đã xây dựng ở Phase 1 để điều khiển trực tiếp kích thước (`width`, `height`), vị trí (`left`, `top`) và độ trong suốt (`opacity`) của Box chứa nội dung di chuyển.
- Trong quá trình chuyển cảnh:
  1. Ẩn tạm thời cả node gốc (ở màn hình cũ) và node đích (ở màn hình mới) bằng cách đặt `opacity: 0` thông qua `heroStore`.
  2. Tạo một clone node bay trên lớp `HeroOverlay` (`zIndex: 9999`).
  3. Nội suy tuyến tính (Lerp) tọa độ và kích thước từ điểm đầu đến điểm cuối dựa vào SharedValue `progress` từ 0 đến 1:
     $$x(t) = x_{from} + (x_{to} - x_{from}) \cdot t$$
     $$y(t) = y_{from} + (y_{to} - y_{from}) \cdot t$$
     $$w(t) = w_{from} + (w_{to} - w_{from}) \cdot t$$
     $$h(t) = h_{from} + (h_{to} - h_{from}) \cdot t$$
  4. Sau khi kết thúc transition, khôi phục `opacity: 1` cho node đích và hủy node bay.

### 4.2. Đặc tả thay đổi Code cho Hero Transition

#### [MODIFY] [Hero.tsx](file:///d:/WORK/react-native-lib/react-native-skia-kit/src/components/Hero.tsx#L175-L203)
Cập nhật `HeroAnimatedRect` để chạy animation nội suy mượt mà qua Reanimated:
```tsx
const HeroAnimatedRect = React.memo(function HeroAnimatedRect({
  from,
  to,
  progress,
  children,
}: HeroAnimatedRectProps & { children: React.ReactNode }) {
  const animatedId = React.useId();

  // Tạo animated style nội suy từ progress (0 -> 1)
  const animatedStyle = useDerivedValue(() => {
    const t = progress.value;
    return {
      left: from.x + (to.x - from.x) * t,
      top: from.y + (to.y - from.y) * t,
      width: from.width + (to.width - from.width) * t,
      height: from.height + (to.height - from.height) * t,
    };
  });

  useSkiaAnimatedStyle(animatedId, animatedStyle);

  return (
    <Box
      id={animatedId}
      style={{
        position: 'absolute',
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
});
```

### 4.3. Loại bỏ JNI / JS Thread Overhead (Worklet Direct Call)
Hiện tại, `useSkiaAnimatedStyle` đang dùng `runOnJS` để đẩy thay đổi từ UI Worklet Thread về JS Thread rồi mới gọi JSI:
```typescript
runOnJS(updateAnimatedStyleJS)(_widgetIdRef.current, result);
```
Điều này tạo ra độ trễ (delay 1-2 frames) và nghẽn JS thread khi chạy nhiều animation cùng lúc.

**Cải tiến tối ưu:**
- Sử dụng Nitro C++ JSI direct binding để đăng ký trực tiếp thực thi C++ trong Worklet context.
- Tạo một cầu nối JSI dạng global hoặc host object cho phép gọi `global.updateAnimatedStylesDirect(id, style)` đồng bộ trực tiếp từ UI Thread mà không qua `runOnJS`.

### 4.4. Tự động hóa Layout Transitions (Layout Animations)
Khi các thành phần trong layout flex thay đổi kích thước hoặc bị xóa/thêm mới (ví dụ: Accordion đóng mở, danh sách thêm item):
- **Cơ chế hoạt động:**
  1. Khi có sự thay đổi layout, Yoga Engine C++ sẽ tính toán ra `layoutMap` mới (tọa độ đích).
  2. Thay vì gán ngay lập tức tọa độ mới khiến UI bị giật/khựng, C++ Engine sẽ lưu trữ tọa độ cũ làm điểm bắt đầu (`fromLayout`) và tọa độ mới làm điểm đích (`toLayout`).
  3. Kích hoạt một Animation Controller nội bộ chạy bằng `SkMSec` (Millisecond clock của Skia) để di chuyển mượt mà các Node từ vị trí cũ sang vị trí mới trong vòng 200-300ms.
- **Thuộc tính cấu hình ở React:**
  Thêm prop `layoutTransition={LayoutTransition.spring()}` hoặc `LayoutTransition.ease()` vào `<Box>` tương tự như Flutter `AnimatedSwitcher` hay React Native LayoutAnimation.
