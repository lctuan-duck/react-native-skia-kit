# Navigation Store Design

## Mục đích
- Quản lý navigationStack, screenMap, stateMap, layoutMap cho từng nav/canvas bằng Zustand + Immer + Map.
- Hỗ trợ Navigator 2.0 (declarative routing) cho deep linking và URL sync.

## Cấu trúc store
```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useNavStore = create(immer((set, get) => ({
  navMaps: new Map(), // key: navId/canvasId, value: { navigationStack, screenMap, stateMap, layoutMap }
  activeNav: 'main',
  currentUrl: '', // Cho Navigator 2.0

  setActiveNav: (navId) => set((state) => {
    state.activeNav = navId;
  }),

  setNavMap: (navId, navObj) => set((state) => {
    state.navMaps.set(navId, navObj);
  }),

  pushScreen: (navId, screenName, widgetTree) => set((state) => {
    let nav = state.navMaps.get(navId);
    if (!nav) {
      nav = { navigationStack: [], screenMap: new Map(), stateMap: new Map(), layoutMap: new Map() };
      state.navMaps.set(navId, nav);
    }
    nav.navigationStack.push(screenName);
    nav.screenMap.set(screenName, widgetTree);
  }),

  popScreen: (navId) => set((state) => {
    const nav = state.navMaps.get(navId);
    if (nav && nav.navigationStack.length > 1) {
      const removed = nav.navigationStack.pop();
      // Giữ screenMap/stateMap cho keep-alive, chỉ xóa nếu cần
    }
  }),

  saveScreenState: (navId, screenName, stateObj) => set((state) => {
    let nav = state.navMaps.get(navId);
    if (!nav) {
      nav = { navigationStack: [], screenMap: new Map(), stateMap: new Map(), layoutMap: new Map() };
      state.navMaps.set(navId, nav);
    }
    nav.stateMap.set(screenName, stateObj);
  }),

  restoreScreenState: (navId, screenName) => {
    const nav = get().navMaps.get(navId);
    return nav?.stateMap?.get(screenName) || {};
  },

  setNavLayoutMap: (navId, layoutMap) => set((state) => {
    let nav = state.navMaps.get(navId);
    if (!nav) {
      nav = { navigationStack: [], screenMap: new Map(), stateMap: new Map(), layoutMap: new Map() };
      state.navMaps.set(navId, nav);
    }
    nav.layoutMap = layoutMap;
  }),

  // Navigator 2.0: update URL khi navigation thay đổi
  setCurrentUrl: (url) => set((state) => {
    state.currentUrl = url;
  }),

  // === Dùng bởi Nav component (auto route registration) ===

  setRouter: (router) => set((state) => {
    state.router = router;
  }),

  setScreens: (screensMap) => set((state) => {
    state.screensMap = screensMap;
  }),

  setCurrentScreen: (screenName) => set((state) => {
    const activeNav = state.activeNav;
    let nav = state.navMaps.get(activeNav);
    if (!nav) {
      nav = { navigationStack: [], screenMap: new Map(), stateMap: new Map(), layoutMap: new Map() };
      state.navMaps.set(activeNav, nav);
    }
    nav.navigationStack = [screenName];
  }),
})));
```

## Navigator 2.0 (Declarative Routing)

### RouteParser
Chuyển đổi URL/deep link thành route config và ngược lại.

```ts
interface RouteConfig {
  path: string;
  screenName: string;
  params: Record<string, string>;
  guard?: () => boolean;
}

class RouteParser {
  private routes: RouteConfig[] = [];

  register(pattern: string, screenName: string, guard?: () => boolean) {
    this.routes.push({ path: pattern, screenName, params: {}, guard });
  }

  // URL → RouteConfig
  parse(url: string): RouteConfig | null {
    for (const route of this.routes) {
      const match = matchPath(url, route.path);
      if (match) {
        return { ...route, params: match.params };
      }
    }
    return null;
  }

  // RouteConfig → URL
  restore(config: RouteConfig): string {
    return buildPath(config.path, config.params);
  }
}
```

### RouterDelegate
Điều phối giữa RouteParser và navStore.

```ts
class RouterDelegate {
  private parser: RouteParser;

  constructor(parser: RouteParser) {
    this.parser = parser;
  }

  // Khi nhận deep link
  handleDeepLink(url: string) {
    const config = this.parser.parse(url);
    if (!config) return;
    if (config.guard && !config.guard()) return;

    const navStore = useNavStore.getState();
    navStore.pushScreen(navStore.activeNav, config.screenName, null);
    navStore.setCurrentUrl(url);
  }

  // Khi navigation thay đổi → update URL
  onNavigationChanged(screenName: string, params: Record<string, string>) {
    const config = { path: '', screenName, params };
    const url = this.parser.restore(config);
    useNavStore.getState().setCurrentUrl(url);
  }
}
```

### Cách sử dụng Router
```tsx
// Đăng ký routes
const router = new RouteParser();
router.register('/home', 'Home');
router.register('/profile/:userId', 'Profile');
router.register('/settings', 'Settings', () => isAuthenticated);

const delegate = new RouterDelegate(router);

// Trong Nav component
<Nav
  router={router}
  delegate={delegate}
  initial="Home"
>
  <HomeScreen name="Home" />
  <ProfileScreen name="Profile" />
  <SettingsScreen name="Settings" />
</Nav>
```

## Sử dụng
- Khi chuyển nav, setActiveNav và lấy navMap tương ứng.
- Khi chuyển màn hình, gọi pushScreen/popScreen.
- Khi lưu state gọi saveScreenState.
- Khi render màn hình, truyền state vào widget tree.
- Khi cần restore state, dùng restoreScreenState.
- Khi nhận deep link, dùng RouterDelegate.handleDeepLink.

## Tích hợp
- Kết hợp với widgetStore, layoutStore, eventStore, integration.md.

## Tham khảo
- [Flutter Navigation](https://docs.flutter.dev/development/ui/navigation)
- [Flutter Navigator 2.0](https://medium.com/flutter/learning-flutters-new-navigation-and-routing-system-7c9068155ade)
- [React Native Skia Animation](https://shopify.github.io/react-native-skia/docs/animation/)
