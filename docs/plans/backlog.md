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
