# Phase 11: State Restoration for Navigation

## Checklist
- [x] Lưu và khôi phục trạng thái (scroll, form, animation) khi chuyển hoặc quay lại màn hình
- [x] Tích hợp stateMap cho từng screen/nav
- [x] Đảm bảo restore UI, animation, input value, scroll position

## Steps
1. Mỗi màn hình khi render, lưu state vào stateMap (Zustand store)
2. Khi chuyển màn hình, lấy lại state từ stateMap, truyền vào widget tree
3. Khi quay lại màn hình cũ, restore state (scroll, form, animation)
4. Cleanup state khi màn hình unmount nếu không cần giữ

 ## Thuật toán/Logic
 Dùng stateMap trong navStore để lưu state từng màn hình. Khi chuyển màn hình, lấy state từ stateMap, truyền vào widget tree. Khi quay lại, khôi phục UI đúng trạng thái. Xem chi tiết API tại [store-design/nav-store.md](store-design/nav-store.md).

## Định hướng
- Đảm bảo trải nghiệm người dùng mượt mà, không mất dữ liệu khi chuyển màn hình
- Dễ mở rộng cho form, scroll, animation, input
- Tích hợp với navStore, widgetStore, layoutStore
