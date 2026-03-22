# Router — Declarative Routing Engine

## Mục đích
- Routing engine cho deep linking, URL sync, và guarded routes.
- Pattern matching với `:param` syntax cho dynamic segments.

## Flutter tương đương
- `Router`, `RouteInformationParser`, `RouterDelegate` (Navigator 2.0)

## API

### createRouter (factory)

```tsx
import { createRouter } from 'react-native-skia-kit';

const { parser, delegate } = createRouter([
  { pattern: '/home', screenName: 'Home' },
  { pattern: '/profile/:userId', screenName: 'Profile' },
  { pattern: '/settings', screenName: 'Settings', guard: () => isLoggedIn },
]);
```

### RouteParser

```ts
class RouteParser {
  register(pattern: string, screenName: string, guard?: () => boolean): void;
  parse(url: string): RouteConfig | null;        // URL → RouteConfig
  restore(screenName: string, params?: Record<string, string>): string;  // RouteConfig → URL
  getRoutes(): ReadonlyArray<RouteDefinition>;
}
```

### RouterDelegate

```ts
class RouterDelegate {
  handleDeepLink(url: string): boolean;           // Parse + navigate
  replaceWithDeepLink(url: string): boolean;      // Parse + replace
  getCurrentUrl(): string;                        // Lấy URL hiện tại
}
```

## TypeScript Interfaces

```ts
interface RouteConfig {
  screenName: string;
  params: Record<string, string>;
  path: string;
}

interface RouteDefinition {
  pattern: string;
  screenName: string;
  guard?: () => boolean;
}
```

## Ví dụ: Deep Linking

```tsx
const { parser, delegate } = createRouter([
  { pattern: '/home', screenName: 'Home' },
  { pattern: '/product/:id', screenName: 'Product' },
  { pattern: '/cart', screenName: 'Cart', guard: () => isAuthenticated },
]);

// Handle incoming deep link
delegate.handleDeepLink('/product/123');
// → navStore.pushScreen('main', 'Product', { id: '123' })

// Get current URL
delegate.getCurrentUrl();
// → '/product/123'
```

## Ví dụ: Guard Route

```tsx
const isLoggedIn = false;

const { delegate } = createRouter([
  { pattern: '/settings', screenName: 'Settings', guard: () => isLoggedIn },
]);

delegate.handleDeepLink('/settings');
// → returns false, không navigate (guard failed)
```

## Quan hệ với navStore
- `handleDeepLink` gọi `navStore.pushScreen()`
- `replaceWithDeepLink` gọi `navStore.replaceScreen()`
- `getCurrentUrl` đọc `navStore.getCurrentScreenName()` + `parser.restore()`

## Nguồn tham khảo
- [Flutter Navigator 2.0](https://medium.com/flutter/learning-flutters-new-navigation-and-routing-system-7c9068155ade)
- [Flutter Router](https://api.flutter.dev/flutter/widgets/Router-class.html)
