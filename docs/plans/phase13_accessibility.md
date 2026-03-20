# Phase 13: Advanced Accessibility

## Checklist
- [ ] Hỗ trợ screen reader, semantics tree, global shortcut
- [ ] Tích hợp accessibilityStore cho widget, layout, nav
- [ ] Đảm bảo UI kit đạt chuẩn accessibility

## Steps
1. Tạo accessibilityStore (Zustand + Map) lưu role, label, state cho từng widget
2. Khi render, đăng ký accessibility info cho widget vào store
3. Tích hợp screen reader, shortcut, semantics tree
4. Khi widget nhận focus, update accessibilityStore, trigger screen reader

## Thuật toán/Logic
- Dùng accessibilityStore để lưu info cho từng widget
- Khi widget nhận focus, update store, trigger screen reader
- Duyệt semantics tree để hỗ trợ accessibility nâng cao

 ## Đề xuất
 Nên tạo accessibilityStore (Zustand + Map) để lưu role, label, state cho từng widget. Khi render, đăng ký accessibility info cho widget vào store. Xem chi tiết API tại [store-design/special-cases.md](store-design/special-cases.md) hoặc bổ sung file accessibilityStore.md nếu cần.

## Định hướng
- Đảm bảo UI kit thân thiện với người dùng khuyết tật
- Dễ mở rộng cho shortcut, global event
- Tích hợp với widgetStore, layoutStore, navStore
