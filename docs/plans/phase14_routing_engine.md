# Phase 14: Advanced Routing Engine

## Checklist
- [ ] Hỗ trợ nested navigation, dynamic route, guarded route
- [ ] Tích hợp routing logic vào navStore
- [ ] Đảm bảo điều hướng linh hoạt, bảo mật, dễ mở rộng

## Steps
1. Thiết kế routing engine: route tree, params, guard
2. Tích hợp routing logic vào navStore (Zustand)
3. Khi nhận route, kiểm tra guard, chuyển màn hình đúng
4. Hỗ trợ nested navigation, dynamic params, guarded route

## Thuật toán/Logic
- Dùng route tree để quản lý navigation
- Khi nhận route, kiểm tra guard, chuyển màn hình
- Hỗ trợ nested navigation, dynamic params

 ## Đề xuất
 Nên thiết kế route tree, params, guard và tích hợp routing logic vào navStore. Khi nhận route, kiểm tra guard, chuyển màn hình đúng. Xem chi tiết API tại [store-design/nav-store.md](store-design/nav-store.md) và [store-design/special-cases.md](store-design/special-cases.md) (deepLinkStore).

## Định hướng
- Đảm bảo navigation linh hoạt, bảo mật, giống Flutter
- Dễ mở rộng cho deep linking, dynamic route
- Tích hợp với navStore, deepLinkStore
