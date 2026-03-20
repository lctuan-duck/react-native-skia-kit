# useNav Hook

## Mục đích
- Truy xuất navigation controller từ `navStore`.
- API gọn gàng cho push, pop, replace, switchTo.

## Flutter tương đương
- `Navigator.of(context)`, `Navigator.push`, `Navigator.pop`

## API

```tsx
import { useNav } from 'react-native-skia-kit';

function ExampleScreen() {
  const nav = useNav();

  // Push screen với params
  nav.push('DetailScreen', { id: '123' });

  // Pop (quay lại)
  nav.pop();

  // Kiểm tra có thể back không
  nav.canGoBack();  // true/false

  // Replace screen hiện tại
  nav.replace('HomeScreen');

  // Switch to screen (cho BottomNav — không push lên stack)
  nav.switchTo('Profile');

  // Lấy params của screen hiện tại
  const params = nav.getParams();  // { id: '123' }

  // Lấy tên screen hiện tại
  const screenName = nav.currentScreen;  // 'DetailScreen'

  // Pop to root (về screen đầu tiên)
  nav.popToRoot();

  return <Group>...</Group>;
}
```

## Implementation

```ts
import { useNavStore } from '../store/navStore';

export function useNav() {
  const store = useNavStore;
  const activeNav = useNavStore((s) => s.activeNav);

  return {
    // Push screen lên stack
    push: (screenName: string, params?: Record<string, any>) => {
      store.getState().pushScreen(activeNav, screenName, null);
      if (params) store.getState().saveScreenState(activeNav, screenName, params);
    },

    // Alias cho push (backward compat)
    pushScreen: (screenName: string, params?: Record<string, any>) => {
      store.getState().pushScreen(activeNav, screenName, null);
      if (params) store.getState().saveScreenState(activeNav, screenName, params);
    },

    // Pop screen khỏi stack
    pop: () => store.getState().popScreen(activeNav),
    popScreen: () => store.getState().popScreen(activeNav),

    // Pop to root
    popToRoot: () => {
      const nav = store.getState().navMaps.get(activeNav);
      if (nav) {
        while (nav.navigationStack.length > 1) {
          store.getState().popScreen(activeNav);
        }
      }
    },

    // Replace screen hiện tại
    replace: (screenName: string, params?: Record<string, any>) => {
      store.getState().popScreen(activeNav);
      store.getState().pushScreen(activeNav, screenName, null);
      if (params) store.getState().saveScreenState(activeNav, screenName, params);
    },

    // Switch to (cho BottomNav — không push lên stack)
    switchTo: (screenName: string) => {
      const nav = store.getState().navMaps.get(activeNav);
      if (nav) {
        nav.navigationStack = [screenName];
      }
    },

    // Kiểm tra có thể back
    canGoBack: () => {
      const nav = store.getState().navMaps.get(activeNav);
      return (nav?.navigationStack.length ?? 0) > 1;
    },

    // Lấy params
    getParams: () => {
      const nav = store.getState().navMaps.get(activeNav);
      const currentScreen = nav?.navigationStack[nav.navigationStack.length - 1];
      return currentScreen ? nav?.stateMap.get(currentScreen) ?? {} : {};
    },
    getCurrentParams: () => {
      const nav = store.getState().navMaps.get(activeNav);
      const currentScreen = nav?.navigationStack[nav.navigationStack.length - 1];
      return currentScreen ? nav?.stateMap.get(currentScreen) ?? {} : {};
    },

    // Lấy tên screen hiện tại
    get currentScreen() {
      const nav = store.getState().navMaps.get(activeNav);
      return nav?.navigationStack[nav.navigationStack.length - 1] ?? '';
    },
  };
}
```

## Cách dùng

### Push với params
```tsx
// Screen A
<Button text="View Detail" onPress={() => nav.push('Detail', { id: product.id })} />

// Screen B (Detail)
function DetailScreen() {
  const nav = useNav();
  const { id } = nav.getParams();
  // ...
}
```

### BottomNav switchTo
```tsx
<BottomNavigationBar
  items={tabs}
  activeIndex={tabIndex}
  onChange={(i) => { setTabIndex(i); nav.switchTo(screens[i]); }}
/>
```

### AppBar back button
```tsx
<AppBar title="Detail" onBack={() => nav.pop()} />
// Hoặc AppBar auto-detect canGoBack()
```

## Links
- Store: [nav-store.md](../store-design/nav-store.md)
- Component: [Nav.md](../components/Nav.md), [AppBar.md](../components/AppBar.md)
