# SkiaKit C++ Engine Architecture

Tài liệu này mô tả chi tiết kiến trúc của lõi C++ (UIEngine) dành cho thư viện `react-native-skia-kit`. Hệ thống này sử dụng JSI (thông qua `react-native-nitro-modules`) để đạt hiệu năng tối đa, xử lý trực tiếp các tính toán nặng như Hit-Testing và Flexbox Layout.

---

## 1. Các Tính Năng Hiện Có

### Phase 2 — Hit Testing ✅
- **Đăng ký/Xoá Node Không Gian:** Cho phép đăng ký các hình chữ nhật (Rect) đại diện cho các Widget kèm ID, zIndex.
- **Hit-Testing Đồng Bộ:** Tính toán và trả về ID của Widget bị chạm tại tọa độ `(x, y)` trực tiếp trên C++ thread/UI thread thông qua JSI mà không bị delay.
- **Xử lý Z-Index & Hit Test Behavior:** Xử lý chồng lấp theo z-index và cơ chế xuyên thấu (`opaque`, `translucent`, `deferToChild`).
- **Giao tiếp Worklet & SharedValues:** Cho phép gọi trực tiếp các hàm C++ (`uiEngine.hitTest`, `uiEngine.updateScrollOffset`) từ Reanimated Worklet qua Nitro HybridObject.
- **Tương tác Scroll mượt mà:** Đồng bộ `ScrollArea` và `scrollOffset` để hỗ trợ "Inverse hit-test shift" ở tầng C++, đảm bảo Hit-Testing chuẩn xác khi lướt (ScrollView Physics UI Thread).

### Phase 3 — C++ Yoga Layout Engine ✅
- **Tích hợp Yoga C++:** Sử dụng `ReactAndroid::yoga` (thư viện built-in của React Native) để tính toán Flexbox hoàn toàn bằng C++.
- **Batch Processing:** Tính toán toàn bộ cây layout trong 1 lần gọi JSI (`calculateLayout` → `getAllLayouts`) và đồng bộ kết quả vào Zustand store.
- **Auto Cleanup (Memory Safe):** Khi component unmount, hook `useNativeYogaLayout` tự động gọi `removeLayoutNode()` → C++ `YGNodeFree()` để giải phóng bộ nhớ.
- **Style đầy đủ:** Hỗ trợ `flexDirection`, `justifyContent`, `alignItems`, `flexWrap`, `width`, `height`, `flex`, `gap`, `padding` (4 cạnh).

### Phase 3.5 — Subsystem Architecture ✅
- **Facade Pattern:** `HybridUIEngine` kế thừa `HybridUIEngineSpec` (Nitro generated), chỉ đóng vai trò điều phối.
- **HitTestSubsystem:** Tách biệt toàn bộ logic va chạm (register/unregister/hitTest).
- **LayoutSubsystem:** Tách biệt toàn bộ logic Yoga (updateLayoutNode/setChildren/calculateLayout/removeLayoutNode).
- **Shared Data Structures:** `cpp/core/Node.hpp` chứa `WidgetNode` và `ScrollArea`.

### Phase 4 — Object-Based Style API & Full Flexbox ✅
- **NativeYogaStyle struct:** Refactored `updateLayoutNode` từ 13+ flat params thành 1 object duy nhất.
- **std::optional<T>:** Mỗi field là optional — C++ chỉ set property nào có `has_value()`.
- **Full Flexbox:** margin (4 cạnh), position (relative/absolute), alignSelf, flexGrow/Shrink/Basis.
- **Extra:** spaceEvenly, rowGap, baseline, wrap-reverse, row-reverse, column-reverse.
- **JS Helper:** `buildNativeStyle()` + `expandEdges()` tự động expand shorthand padding/margin.

---

## 2. Các Tính Năng Cần Thiết Cho Tương Lai

### Phase 5 — Kết Nối Layout ↔ HitTest & QuadTree
- **Kết nối Layout ↔ HitTest:** Sau khi Yoga tính xong toạ độ, tự động cập nhật lại HitTest Subsystem.
- **QuadTree / R-Tree Spatial Query:** Nâng cấp thuật toán duyệt tuyến tính (O(N)) lên O(log N).
- **Strategy Pattern:** Triển khai `IHitTestStrategy` interface → `LinearHitTest` và `QuadTreeHitTest`.
- **Dirty Flag Layout:** Chỉ tính toán lại layout khi style thực sự thay đổi.

### Phase 6 — Render Tree & Advanced Features
- **Quản lý Vòng Đời Node C++:** Chuyển đổi sang hệ thống **Render Tree** bên trong C++.
- **Multi-touch & Gesture Physics:** Đưa tính toán vật lý (Pinch, Pan) trực tiếp vào C++ nếu cần.

---

## 3. Design Patterns Đã Triển Khai

### 3.1. Facade Pattern ✅
- **Lớp `HybridUIEngine`**: Kế thừa `HybridUIEngineSpec` (Nitro generated), đóng vai trò mặt tiền (Facade).
- JSI/TypeScript chỉ giao tiếp với duy nhất một Object (`uiEngine.hitTest(...)`, `uiEngine.calculateLayout(...)`).

### 3.2. Subsystem Pattern ✅
- `HitTestSubsystem` — Quản lý toạ độ, z-index, và thuật toán tìm kiếm va chạm.
- `LayoutSubsystem` — Quản lý cây Yoga node, tính toán Flexbox, giải phóng bộ nhớ.

### 3.3. Strategy Pattern (Planned)
- **Giao diện `IHitTestStrategy`**: Sẽ triển khai ở Phase 5.
- `LinearHitTestStrategy` (duyệt mảng O(N)) → `QuadTreeHitTestStrategy` (O(log N)).

---

## 4. Cách Hoạt Động & Logic Sử Dụng

### Luồng Hit-Test
1. **JS/React Mount:** Component `Box` mount → `useHitTest` gọi `uiEngine.registerWidget(...)`.
2. **Gesture (Worklet):** Người dùng vuốt màn hình, Reanimated Worklet bắt sự kiện.
3. **Synchronous Call:** Worklet gọi `uiEngine.hitTest(e.x, e.y)` (không qua JS Bridge).
4. **C++ Execution:** `HitTestSubsystem` tìm kiếm, lọc z-index, trả về mảng ID widget.
5. **Event Routing:** Worklet cập nhật `SharedValue`, widget chạy animation tương ứng.

### Luồng Layout (Đã triển khai)
1. **React Mount:** Component gọi `useNativeYogaLayout(widgetId, style, children)`.
2. **useLayoutEffect:** Gọi `uiEngine.updateLayoutNode(...)` truyền flexDirection, justifyContent, width, height, gap, padding...
3. **Parse Children:** Duyệt `React.Children`, lấy `id` prop, gọi `uiEngine.setChildren(parentId, childIds)`.
4. **CanvasRoot Trigger:** `CanvasRoot` gọi `uiEngine.calculateLayout(canvasId, screenW, screenH)` → Yoga tính toàn bộ cây.
5. **Batch Fetch:** `uiEngine.getAllLayouts()` trả về `Record<string, {x,y,width,height}>`, cập nhật vào `layoutStore`.
6. **Render:** Component đọc `layoutStore` → nhận toạ độ tuyệt đối → render `<Group>` Skia.
7. **Unmount Cleanup:** `useLayoutEffect` cleanup gọi `uiEngine.removeLayoutNode(widgetId)` → `YGNodeFree()`.

---

## 5. Cấu Trúc Folder Phần C++

```text
cpp/
├── HybridUIEngine.cpp          # Facade class (kế thừa HybridUIEngineSpec)
├── HybridUIEngine.hpp          # Header cho Facade
├── core/
│   └── Node.hpp                # Struct WidgetNode, ScrollArea
├── subsystems/
│   ├── HitTestSubsystem.cpp    # Hệ thống quản lý va chạm
│   ├── HitTestSubsystem.hpp
│   ├── LayoutSubsystem.cpp     # Hệ thống quản lý Flexbox Layout (Yoga)
│   └── LayoutSubsystem.hpp
└── strategies/                 # (Phase 5 — Chưa triển khai)
    ├── IHitTestStrategy.hpp    # Interface cho Strategy
    ├── LinearHitTest.cpp       # Thuật toán duyệt mảng O(N)
    └── QuadTreeHitTest.cpp     # Thuật toán QuadTree O(log N)
```
