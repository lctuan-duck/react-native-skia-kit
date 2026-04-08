# Roadmap Kỹ thuật: Chuyển đổi Skia Layout Engine xuống C++

Tài liệu này đóng vai trò như một bảng Backlog chi tiết, vạch ra các giai đoạn (Phases) và hạng mục công việc (Tasks) cần thiết để di chuyển logic render giao diện từ JavaScript thuần sang nền tảng JSI/C++. Mục tiêu tối hậu là đạt sức mạnh tính toán và khả năng quản lý Layout/Render ngang ngửa với kiến trúc lõi của Flutter (`RenderObject`, `RelayoutBoundary`, `LayerTree`).

---

## Giai đoạn 1: Khởi động JSI Bridge (JavaScript Interface) & Giao tiếp
**Mục tiêu:** Thiết lập "đường cao tốc" JSI để JavaScript có thể nói chuyện trực tiếp với C++ (bỏ qua async bridge mặc định của React Native) và kiểm chứng tốc độ truyền dữ liệu.

- [ ] **Task 1.1:** Setup hệ thống C++ cho module. Tích hợp `react-native-nitro-modules` (hoặc viết JSI Native Module tùy chỉnh) để dễ dàng generate code C++ bindings.
- [ ] **Task 1.2:** Thiết kế cơ chế Serialize (Đóng gói dữ liệu). Viết thuật toán để biến chuỗi `childInfos` (width, flex, gap...) từ JS thành các mảng bytes hoặc struct phẳng truyền qua C++ siêu tốc (tránh việc truyền chuỗi JSON bự tốn chi phí parse).
- [ ] **Task 1.3:** Tạo hàm `calculateLayoutCxx(serializedTree)` gọi từ JS, trả về 1 block memory chứa tọa độ `[x,y,w,h]` của hàng loạt component để kiểm chứng đường truyền hoạt động ổn định.

---

## Giai đoạn 2: Cài cắm Thuật toán Layout (Porting Engine) 
**Mục tiêu:** Di chuyển hoặc thay thế thuật toán của `useYogaLayout.ts` sang C++ để hưởng lợi từ tốc độ tính toán phần cứng.

- [ ] **Task 2.1 (Quyết định kiến trúc):**
  - *Option A:* Tái hiện (Port) lại logic `Sizes Go Up`, `Constraints Go Down` (100% tự viết bằng C++).
  - *Option B (Khuyên dùng):* Nhúng thư viện lõi **Yoga (C++)** của Meta vào module. Ánh xạ các properties từ JS thẳng thành Node của Yoga.
- [ ] **Task 2.2: Hệ thống đo đạc Text (Text Measurer)**
  - Đây là bottleneck lớn nhất. Xây dựng cầu nối để C++ gọi các hàm đo Text của SkParagraph (tương tự như `font.measureText()`) ngay TẦNG C++ thay vì đợi JS đo truyền xuống.
- [ ] **Task 2.3:** Tối ưu hóa tính toán Intrinsic Size trong C++. Biến các hàm `estimateIntrinsicSize` thành logic đệ quy duyệt cây trên C++, nhanh hơn gấp bội so với lặp array của React.

---

## Giai đoạn 3: Cây Persistent C++ & Relayout Boundaries (Đột phá)
**Mục tiêu:** Không ném dữ liệu từ đầu ở mỗi frame nữa. Thay vào đó, xây dựng một cái cây C++ sống vĩnh viễn trong RAM (RenderObject), chỉ nhận hiệu lệnh sửa đổi từ JS (Mutation).

- [ ] **Task 3.1:** Xây dựng Class `SKRenderNode` trên C++. Khi JS lần đầu boot lên, tạo n node trên C++. Phát ra các ID tương ứng để JS nắm giữ cục pointer.
- [ ] **Task 3.2: Cơ chế Mutation API.** Thay vì JS map children array ra rồi ném qua JSI ở mỗi re-render, tạo các phương thức kết nối: `updateNode(id, prop)`, `insertChild(parentId, childId)`, `removeChild(id)`.
- [ ] **Task 3.3: Thuật toán Relayout Boundary.**
  - Thêm cờ `bool needsLayout = false;` vào `SKRenderNode`.
  - Bất cứ khi prop thay đổi, cờ này kích hoạt, nhưng lội ngược lên cha. Nếu cha xác định là Fixed Size (kích thước cố định), DỪNG LẠI (Relayout Boundary). Frame tiếp theo thuật toán C++ chỉ quét và tính đại số từ Boundary trở xuống. Tính thừa kế O(1).

---

## Giai đoạn 4: Layer Tree & Repaint Boundaries (Tính năng nâng cao đồ họa)
**Mục tiêu:** Không xóa trắng toàn bộ `Canvas` để vẽ lại chỉ vì 1 dòng chữ bị in đậm. Tiết kiệm băng thông GPU.

- [ ] **Task 4.1: Xây dựng cấu trúc Layer.** Tạo hệ thống `ContainerLayer`, `TransformLayer` (chuyên dùng zoom/xoay), `OpacityLayer`.
- [ ] **Task 4.2:** Tích hợp `SkPictureRecorder` của thư viện Skia. Bất kỳ node nào là Repaint Boundary sẽ tự ghi hình (record) lại tất cả nét vẽ con cái của nó thành 1 cục Image ảo (`SkPicture`). 
- [ ] **Task 4.3: Nhúng C++ Compositor.** Tại thời điểm vẽ tổng (DrawPass), quét lại toàn bộ cây. Đoạn Layer nào không "bẩn" (`!needsPaint`), lấy ngay `SkPicture` trong cache ra đập lên màn hình. Siêu việt hóa việc vẽ lại hàng ngàn khung hình.

---

## Giai đoạn 5: Hit-testing & Gesture Binding trên C++
**Mục tiêu:** Tính toán giao điểm chạm Cực Nhanh hoàn toàn qua các ma trận 3D của C++, tránh delay của cầu JS.

- [ ] **Task 5.1:** Lắng nghe touch từ RNGestureHandler (cắm rễ C++) hoặc Native Event.
- [ ] **Task 5.2:** Viết hàm `hitTest(x,y)` trực tiếp trên cây giả lập `SKRenderNode`. Hàm này chạy xuyên qua các Transform ma trận (nghĩa là dù bạn xoay component đó 45 độ, điểm chạm vẫn dính chính xác vào con chip đó).
- [ ] **Task 5.3:** Đẩy event ID về lại JS hoặc cho phép thực thi Animation callback ngay trong C++ (Bắt tay với Reanimated Worklet).

---
*Lưu ý triển khai: Giai đoạn 1 & 2 mang lại 80% Performance Gain so với hiện tại nhưng tốn chỉ 20% công sức. Giai đoạn 3 & 4 là đẳng cấp ngang khung chuẩn của Google. Nên làm từng bước để test hồi quy ứng dụng.*
