# SkiaKit C++ Engine Architecture

Tài liệu này mô tả chi tiết kiến trúc của lõi C++ (UIEngine) dành cho thư viện `react-native-skia-kit`. Hệ thống này sử dụng JSI (thông qua `react-native-nitro-modules`) để đạt hiệu năng tối đa, xử lý trực tiếp các tính toán nặng như Hit-Testing và (trong tương lai) Flexbox Layout.

---

## 1. Các Tính Năng Hiện Có (Phase 2 - Hit Testing)
- **Đăng ký/Xoá Node Không Gian:** Cho phép đăng ký các hình chữ nhật (Rect) đại diện cho các Widget kèm ID, zIndex.
- **Hit-Testing Đồng Bộ:** Tính toán và trả về ID của Widget bị chạm tại tọa độ `(x, y)` trực tiếp trên C++ thread/UI thread thông qua JSI mà không bị delay.
- **Xử lý Z-Index & Hit Test Behavior:** Xử lý chồng lấp theo z-index và cơ chế xuyên thấu (`opaque`, `translucent`, `deferToChild`).
- **Giao tiếp Worklet & SharedValues:** Cho phép gọi trực tiếp các hàm C++ (`uiEngine.hitTest`, `uiEngine.updateScrollOffset`) từ Reanimated Worklet qua Nitro HybridObject.
- **Tương tác Scroll mượt mà:** Đồng bộ `ScrollArea` và `scrollOffset` để hỗ trợ "Inverse hit-test shift" ở tầng C++, đảm bảo Hit-Testing chuẩn xác khi lướt (ScrollView Physics UI Thread).

---

## 2. Các Tính Năng Cần Thiết Cho Tương Lai (Phase 3 - Mở Rộng)
- **C++ Layout Engine (Flexbox):** Tích hợp thư viện [Yoga C++](https://yogalayout.dev/) để tính toán Flexbox hoàn toàn bằng C++, thay thế cho `useYogaLayout.ts` hiện tại.
- **QuadTree / R-Tree Spatial Query:** Nâng cấp thuật toán duyệt tuyến tính (O(N)) hiện tại lên cấu trúc dữ liệu không gian O(log N), đáp ứng hàng chục ngàn widget.
- **Quản lý Vòng Đời Node C++:** Chuyển đổi từ việc quản lý các Rect độc lập sang một hệ thống **Render Tree** hoàn chỉnh bên trong C++ (mỗi node chứa cả layout props, style, và kích thước).
- **Multi-touch & Gesture Physics:** Đưa một phần tính toán vật lý (nhận dạng Pinch, Pan) trực tiếp vào C++ nếu Reanimated không đủ đáp ứng.

---

## 3. Design Patterns Khuyến Nghị
Hệ thống được thiết kế dựa trên các pattern kinh điển để đảm bảo khả năng mở rộng (SOLID):

### 3.1. Facade Pattern
- **Lớp `UIEngine`**: Đóng vai trò là mặt tiền (Facade), che giấu sự phức tạp của các hệ thống bên dưới (HitTest, Layout).
- **Lợi ích:** JSI/TypeScript chỉ cần giao tiếp với duy nhất một Object (`uiEngine.hitTest(...)`, `uiEngine.calculateLayout(...)`), giảm thiểu số lượng module JSI cần đăng ký.

### 3.2. Subsystem Pattern
- Chia nhỏ lõi C++ thành các Subsystem độc lập: `HitTestSubsystem`, `LayoutSubsystem`.
- **Lợi ích:** Dễ dàng bảo trì, chia tách trách nhiệm (Separation of Concerns). Layout Subsystem sẽ chỉ quan tâm đến Yoga, còn HitTest Subsystem chỉ quan tâm đến Toạ độ.

### 3.3. Strategy Pattern
- **Giao diện `IHitTestStrategy`**: Định nghĩa một chuẩn chung cho thuật toán tìm kiếm va chạm.
- Có thể triển khai `LinearHitTestStrategy` (duyệt mảng đơn giản) cho các UI cơ bản, và chuyển đổi sang `QuadTreeHitTestStrategy` khi dữ liệu phình to mà không làm ảnh hưởng đến lõi.

---

## 4. Cách Hoạt Động & Logic Sử Dụng

### Luồng Hit-Test (Hiện tại)
1. **JS/React Mount:** Khi một component (như `Box`) mount, hook `useHitTest` gọi `uiEngine.registerWidget(...)` truyền tọa độ x, y, w, h vào C++.
2. **Gesture (Worklet):** Người dùng vuốt màn hình. Sự kiện bắt được trong Reanimated Worklet (`Gesture.Pan().onUpdate`).
3. **Synchronous Call:** Worklet gọi `uiEngine.hitTest(e.x, e.y)` (không qua JS Bridge).
4. **C++ Execution:** C++ Subsystem thực thi logic không gian (tìm kiếm, lọc z-index) và trả về mảng ID widget.
5. **Event Routing:** Worklet cập nhật `SharedValue` (`activePanWidgetId`). Các widget tự động chạy physics animation tương ứng.

### Luồng Layout (Tương lai)
1. Khi Render, thay vì JS tự tính flex, JS sẽ gọi `uiEngine.createNode(...)` và `uiEngine.setFlexProps(...)`.
2. Gắn kết cấu trúc cây: `uiEngine.appendChild(...)`.
3. JS gọi `uiEngine.calculateLayout(windowWidth, windowHeight)`. C++ sẽ chạy Yoga và trả về một cây toạ độ tuyệt đối.
4. JS lấy toạ độ này gắn vào thẻ `<Group>` của Skia để render.

---

## 5. Cấu Trúc Folder Phần C++
Thư mục C++ (`cpp/`) sẽ được tổ chức như sau:

```text
cpp/
├── UIEngine.cpp                # Facade class (Triển khai HybridObject của Nitro)
├── UIEngine.hpp                # Header cho Facade
├── core/                       
│   ├── Node.hpp                # Lớp cơ sở đại diện cho một Widget/Element trên C++
│   └── Config.hpp              # Định nghĩa hằng số, log macros
├── subsystems/
│   ├── HitTestSubsystem.cpp    # Hệ thống quản lý va chạm chạm
│   ├── HitTestSubsystem.hpp
│   ├── LayoutSubsystem.cpp     # Hệ thống quản lý Flexbox Layout (Phase 3)
│   └── LayoutSubsystem.hpp
└── strategies/
    ├── IHitTestStrategy.hpp    # Interface cho Strategy
    ├── LinearHitTest.cpp       # Thuật toán duyệt mảng O(N)
    └── QuadTreeHitTest.cpp     # Thuật toán QuadTree O(log N) (Tương lai)
```
