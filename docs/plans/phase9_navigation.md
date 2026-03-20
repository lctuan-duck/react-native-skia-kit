## Store Design cho Navigation
- Toàn bộ logic quản lý navigationStack, screenMap, stateMap, layoutMap, Router đã được tách riêng vào các file trong thư mục [store-design](../store-design/).
- Xem chi tiết tại:
  - [nav-store.md](../store-design/nav-store.md) — Navigator stack + Navigator 2.0
  - [integration.md](../store-design/integration.md)
  - [special-cases.md](../store-design/special-cases.md) — Hero animation store
- Khi cần sử dụng các hàm quản lý navigation, chỉ cần import từ các store này.

## Lưu ý
- Khi chuyển nav, set activeNav và layoutMap = navMaps[navName].layoutMap. Khi quay lại nav cũ, layoutMap được giữ nguyên (keep-alive).
- Khi chuyển màn hình, gọi pushScreen/popScreen.
- Khi render màn hình, truyền state vào widget tree.
- Để quản lý state nâng cao cho navigation, sử dụng các hàm từ [nav-store.md](../store-design/nav-store.md).

# Phase 9: Internal Navigation Manager

## Checklist
- [ ] Quản lý biến currentScreen để chuyển màn hình
- [ ] Vẽ hiệu ứng Slide/Fade giữa các danh sách widget
- [ ] Không dùng react-navigation, tự quản lý navigation logic
- [ ] Triển khai Navigator 2.0 (Router) cho deep linking
- [ ] Triển khai Hero Animation cho shared element transition

## Steps
1. Định nghĩa biến currentScreen (state hoặc context)
2. Khi chuyển màn hình, cập nhật currentScreen
3. Dùng Skia để vẽ hiệu ứng chuyển (Slide, Fade...)
4. Đảm bảo navigation mượt mà, không lag

## Navigator 2.0 (Declarative Routing)
Bổ sung Router layer để hỗ trợ deep linking và URL sync.

### Kiến trúc
```
Deep Link / URL → RouteParser.parse() → RouteConfig
  → RouterDelegate.handleDeepLink() → navStore.pushScreen()
  → Nav render screen

Navigation thay đổi → RouteParser.restore() → Update URL/DeepLink
```

### RouteParser
```ts
class RouteParser {
  register(pattern: string, screenName: string, guard?: () => boolean) { ... }
  parse(url: string): RouteConfig | null { ... }   // URL → RouteConfig
  restore(config: RouteConfig): string { ... }       // RouteConfig → URL
}
```

### RouterDelegate
```ts
class RouterDelegate {
  handleDeepLink(url: string) {
    const config = parser.parse(url);
    if (config?.guard && !config.guard()) return;
    navStore.pushScreen(activeNav, config.screenName, null);
    navStore.setCurrentUrl(url);
  }
}
```

### Cách sử dụng
```tsx
const router = new RouteParser();
router.register('/home', 'Home');
router.register('/profile/:userId', 'Profile');
router.register('/settings', 'Settings', () => isAuthenticated); // guarded route

<Nav router={router} initial="Home">
  <HomeScreen name="Home" />
  <ProfileScreen name="Profile" />
  <SettingsScreen name="Settings" />
</Nav>
```

## Hero Animation
Shared element transition khi chuyển màn hình.

### Nguyên lý
1. Screen A có `<Hero tag="avatar">` tại rect (50, 100, 80, 80)
2. Navigate sang Screen B, cũng có `<Hero tag="avatar">` tại rect (0, 0, 360, 200)
3. heroStore lưu rect + snapshot của cả hai
4. Tạo overlay animation: lerp(rectA, rectB, t) trong transition
5. Vẽ widget snapshot trên overlay, animate position + size

### Sử dụng
```tsx
// Screen A
<Hero tag="product-image">
  <Image src={thumbnail} width={80} height={80} />
</Hero>

// Screen B
<Hero tag="product-image">
  <Image src={fullImage} width={360} height={200} />
</Hero>
```

## Thuật toán/Logic
- Navigation: Chuyển đổi danh sách widget theo currentScreen
- Hiệu ứng chuyển: Dùng animation (Reanimated) để vẽ Slide/Fade
- Router: Deep link → parse → guard check → navigate
- Hero: Snapshot widget → overlay → animate rect

## Phân tích khó khăn & hiệu năng
- Tự quản lý navigation cần xử lý stack, lịch sử, transition animation.
- Navigator 2.0 giúp đơn giản hóa deep linking và URL sync.
- Hiệu năng tốt nếu chỉ render màn hình active + keep-alive cho inactive.
- Hero animation cần thêm overlay layer nhưng chỉ active trong transition.

## Giải pháp giữ UI khi chuyển navigation
- Khi chuyển nav, chỉ cần set lại layoutMap, screenMap, stateMap của nav active.
- Các nav khác giữ nguyên dữ liệu riêng biệt.
- Khi quay lại nav/màn hình cũ, lấy lại widget tree và state, render lại đúng vị trí.
- Có thể dùng memoization hoặc cache để tối ưu.

## Đề xuất
- Không dùng react-navigation, tự quản lý navigation logic bằng các store đã thiết kế.
- Đảm bảo navigation mượt mà, không lag, và có thể giữ lại UI của nav cũ (keep-alive).

## Nguồn tham khảo
- [Flutter Navigation](https://docs.flutter.dev/development/ui/navigation)
- [Flutter Navigator 2.0](https://medium.com/flutter/learning-flutters-new-navigation-and-routing-system-7c9068155ade)
- [Flutter Hero Animation](https://docs.flutter.dev/ui/animations/hero-animations)
- [React Native Skia Animation](https://shopify.github.io/react-native-skia/docs/animation/)
