# Nav Component (Navigation Container)

## Mục đích
- Quản lý navigation stack và render màn hình hiện tại.
- Hỗ trợ Navigator 2.0, deep linking, Hero animation.

## Flutter tương đương
- `Navigator`, `Router`, `MaterialPageRoute`

## TypeScript Interface

```ts
// Props cho mỗi Screen (child của Nav)
interface ScreenProps {
  name: string;              // REQUIRED — tên screen, dùng để đăng ký route
  path?: string;             // custom URL pattern (VD: '/detail/:id')
                             // nếu không truyền → auto '/' + name.toLowerCase()
}

// Props cho Nav
interface NavProps extends WidgetProps {
  initial: string;           // REQUIRED — tên screen ban đầu
  children: React.ReactNode; // REQUIRED — các screen components (có prop name)
  router?: RouteParser;      // Custom router (nếu không truyền → auto tạo)
  delegate?: RouterDelegate; // Deep linking
  onNavigate?: (screenName: string) => void;
}
```

## Props Table

### Nav Props

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `initial` | `string` | — | ✅ | Màn hình ban đầu |
| `children` | `ReactNode` | — | ✅ | Screen components |
| `router` | `RouteParser` | auto | ❌ | Custom router (auto tạo nếu không truyền) |
| `delegate` | `RouterDelegate` | — | ❌ | Deep linking delegate |
| `onNavigate` | `(screenName) => void` | — | ❌ | Callback khi chuyển |

### Screen Props (child)

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `name` | `string` | — | ✅ | Tên screen (dùng làm route key) |
| `path` | `string` | `'/' + name.toLowerCase()` | ❌ | Custom URL pattern |

## Kiến trúc: React-level (không phải Skia node)

> **Nav là React component, không phải Skia node.**
> Nav quản lý LOGIC navigation rồi trả về Skia tree của screen hiện tại để CanvasRoot vẽ.
> Mỗi Screen là một Skia sub-tree (Group + Skia nodes), không có Canvas riêng.

```
App
└── CanvasRoot (<Canvas> — DUY NHẤT)
    └── Nav (React logic)
        └── currentScreen.render()  ← Skia tree của screen hiện tại
            ├── <Group>  ← màn hình A (opacity=1 nếu active)
            └── <Group>  ← màn hình B (transition đang chạy)
```

## Core Implementation

```tsx
// Nav tự đăng ký routes từ children — không cần router.register() bên ngoài
function Nav({ children, initial, router: externalRouter, delegate, onNavigate }: NavProps) {
  const { currentScreen, previousScreen, transition } = useNavigationStore();

  useEffect(() => {
    // 1. Auto tạo router nếu không truyền từ ngoài
    const router = externalRouter ?? new RouteParser();

    // 2. Duyệt children → đăng ký route + screen
    const screensMap: Record<string, ReactNode> = {};
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child) || !child.props.name) return;
      const { name, path } = child.props;

      // Auto-generate path nếu screen không có prop path
      const routePath = path ?? `/${name.toLowerCase()}`;
      router.register(routePath, name);

      screensMap[name] = child;
    });

    // 3. Set router + screens vào store
    navStore.setRouter(router);
    navStore.setScreens(screensMap);
    navStore.setCurrentScreen(initial || Object.keys(screensMap)[0]);
  }, [children]);

  return (
    <>
      {/* Previous screen (trong transition) */}
      {previousScreen && (
        <Group opacity={transition.prevOpacity}>
          {previousScreen}
        </Group>
      )}
      {/* Current screen */}
      <Group opacity={transition.currentOpacity}>
        {currentScreen}
      </Group>
      {/* Hero animation overlay */}
      <HeroOverlay />
    </>
  );
}
```

### Auto-registration flow

```
Nav mount
  → duyệt children
  → child.props.name = 'Home' → router.register('/home', 'Home')
  → child.props.name = 'Detail', path = '/detail/:id' → router.register('/detail/:id', 'Detail')
  → set router + screensMap vào navStore
```

## Screen là Skia tree

```tsx
// Mỗi screen KHÔNG có Canvas riêng — chỉ là Skia Group
function HomeScreen({ name }) {
  return (
    <Group>  {/* ← Screen container, không phải Canvas */}
      <Rect x={0} y={0} width={360} height={800} color="white" />
      <Text x={16} y={60} text="Home" fontSize={24} />
      <Button x={16} y={200} text="Go to Profile" onPress={() => nav.push('Profile')} />
    </Group>
  );
}

// Đăng ký vào Nav — KHÔNG CẦN router.register() thủ công
<Nav initial="Home">
  <HomeScreen name="Home" />           {/* → auto: /home */}
  <ProfileScreen name="Profile" />     {/* → auto: /profile */}
</Nav>
```

## Có params trong URL (Deep Linking)

```tsx
// Chỉ cần thêm prop path cho screen có params
<Nav initial="Home">
  <HomeScreen name="Home" />
  <ProfileScreen name="Profile" path="/profile/:userId" />
</Nav>
// Nav auto-register: /home → Home, /profile/:userId → Profile
```

## Custom Router (nâng cao)

```tsx
// Chỉ truyền router từ ngoài khi cần custom RouteParser (hiếm khi)
const customRouter = new RouteParser({ strict: true });

<Nav router={customRouter} initial="Home">
  <HomeScreen name="Home" />
  <ProfileScreen name="Profile" path="/profile/:userId" />
</Nav>
```

## Hero Animation
```tsx
// Screen A
<Group>
  <Hero tag="product-1">
    <Image x={16} y={100} width={80} height={80} src={thumbnail} />
  </Hero>
</Group>

// Screen B
<Group>
  <Hero tag="product-1">
    <Image x={0} y={200} width={360} height={200} src={fullImage} />
  </Hero>
</Group>
// heroStore quản lý transition: chụp rect → overlay animation (lerp)
```

## Links
- Hook: [useNav.md](../hooks/useNav.md)
- Store: [nav-store.md](../store-design/nav-store.md), [hero-store.md](../store-design/hero-store.md)
- Related: [TabBar.md](./TabBar.md), [Drawer.md](./Drawer.md)
- Phase: [phase9_navigation.md](../plans/phase9_navigation.md)
