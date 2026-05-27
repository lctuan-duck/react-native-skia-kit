# Backlog — Medium Priority Flutter Widgets

> Các widget này **chưa triển khai** nhưng nên có để hoàn thiện Flutter parity.
> Có thể dùng workaround bằng components hiện tại.

## 🟡 Medium Priority

### AnimatedContainer (~100 LOC)
- **Flutter**: `AnimatedContainer`, `AnimatedOpacity`, `AnimatedPositioned`
- **Mô tả**: Implicit animation — auto-animate khi props thay đổi (width, height, color, opacity)
- **Workaround hiện tại**: Dùng `useAnimation` hook + manual update
- **File đề xuất**: `src/components/AnimatedContainer.tsx`

### ClipRRect / ClipOval (~40 LOC)
- **Flutter**: `ClipRRect`, `ClipOval`, `ClipPath`
- **Mô tả**: Clip children theo rounded rect hoặc oval
- **Workaround hiện tại**: Skia `Group` có `clip` prop, nhưng cần wrap rõ ràng
- **File đề xuất**: `src/components/Clip.tsx`

### Transform (~40 LOC)
- **Flutter**: `Transform.rotate`, `Transform.scale`, `Transform.translate`
- **Mô tả**: Áp dụng transform matrix cho children
- **Workaround hiện tại**: Skia `Group` có `transform` prop
- **File đề xuất**: `src/components/Transform.tsx`

### PopScope (~30 LOC)
- **Flutter**: `PopScope` (thay thế `WillPopScope` deprecated)
- **Mô tả**: Xử lý nút Back (Android) — cho phép cancel hoặc custom back behavior
- **Workaround hiện tại**: RN `BackHandler` + `useNav().canGoBack()`
- **File đề xuất**: `src/components/PopScope.tsx`

### SliverAppBar (~80 LOC)
- **Flutter**: `SliverAppBar`
- **Mô tả**: AppBar co/dãn khi scroll — expanded → collapsed
- **Workaround hiện tại**: Manual tracking scroll offset + animated AppBar height
- **File đề xuất**: `src/components/SliverAppBar.tsx`

### FloatingActionButton (~40 LOC)
- **Flutter**: `FloatingActionButton`
- **Mô tả**: Nút tròn floating ở góc phải dưới
- **Workaround hiện tại**: `Box` + `position="absolute"` + `borderRadius=28`
- **File đề xuất**: `src/components/FloatingActionButton.tsx`

---

## 🟢 Low Priority (dùng workaround)

| Widget | Workaround |
|--------|-----------|
| `DatePicker` / `TimePicker` | Build riêng hoặc dùng RN native picker |
| `DataTable` | Row/Column + Box grid |
| `Stepper` | Column + custom state |
| `NavigationRail` | Row + Column layout |
| `AnimatedList` | VirtualizedList + useAnimation |

---

## 🔴 High Priority — Missing (từ Component Review 2026-05-26)

### Dialog / AlertDialog (~120 LOC)
- **Flutter**: `AlertDialog`, `SimpleDialog`, `Dialog`
- **Mô tả**: Modal dialog với title, content, actions. Cần overlay + barrier tap dismiss.
- **Dependency**: `Overlay`, `overlayStore` (đã có)
- **File đề xuất**: `src/components/Dialog.tsx`
- **Ưu tiên**: 🔴 Cần thiết — rất nhiều app cần confirm dialog

### BottomSheet (~150 LOC)
- **Flutter**: `BottomSheet`, `showModalBottomSheet`, `DraggableScrollableSheet`
- **Mô tả**: Panel trượt từ dưới lên, có thể kéo để đóng (pan gesture + spring back).
- **Dependency**: `GestureDetector`, `useAnimatedStyle`, C++ layout transition
- **File đề xuất**: `src/components/BottomSheet.tsx`
- **Ưu tiên**: 🔴 Cần thiết — pattern cực phổ biến trong mobile UI

---

## 🟡 Medium Priority — Missing (từ Component Review 2026-05-26)

### Rating / StarRating (~80 LOC)
- **Flutter**: `Rating` (package `flutter_rating_bar`)
- **Mô tả**: Dãy 5 sao, hỗ trợ half-star, tap/drag để rate.
- **File đề xuất**: `src/components/Rating.tsx`

### Skeleton / Shimmer Loader (~60 LOC)
- **Flutter**: `Shimmer` (package)
- **Mô tả**: Placeholder loading animation — linear gradient sweep từ trái sang phải.
- **Dependency**: Phase 3 gradient đã có → triển khai bằng `animated gradient`
- **File đề xuất**: `src/components/Skeleton.tsx`

### Swipeable Row (~100 LOC)
- **Flutter**: `Dismissible`
- **Mô tả**: Vuốt ngang để reveal action buttons (delete, archive...).
- **Dependency**: `GestureDetector` (pan), layout transition
- **File đề xuất**: `src/components/Swipeable.tsx`

### ColorPicker (~120 LOC)
- **Flutter**: `ColorPicker` (package)
- **Mô tả**: Wheel hoặc slider để chọn màu — cần Skia arc drawing.
- **File đề xuất**: `src/components/ColorPicker.tsx`
