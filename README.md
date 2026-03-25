# react-native-skia-kit

A **Flutter-like UI Kit** for React Native that renders all UI on a single **Skia Canvas** — high-performance custom widgets with Yoga layout, gesture handling, and Material 3 theming.

> 🚧 **Work in Progress** — Core foundation implemented. Components being added progressively.

## ✨ Features

- 🎨 **Single Canvas rendering** — All UI rendered on a single Canvas (like Flutter)
- 📐 **Yoga Layout Engine** — Flexbox layout equivalent to Flutter Row/Column/Expanded
- 🎯 **Gesture System** — Hit testing + GestureArena like Flutter GestureDetector
- 🌗 **Theme System** — Light/Dark themes, Material 3 typography, persistence support
- 🧭 **Navigation** — Stack-based navigation like Flutter Navigator
- ⚡ **Animations** — Powered by react-native-reanimated
- 🧩 **49 Components** — From Box, Text to Scaffold, Hero, SearchBar

## 📦 Installation

```sh
yarn add react-native-skia-kit

# Peer dependencies
yarn add @shopify/react-native-skia react-native-reanimated react-native-gesture-handler
```

## 🚀 Quick Start

```tsx
import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CanvasRoot, Box, Text, Column, Button, useTheme } from 'react-native-skia-kit';

function HomeScreen() {
  const theme = useTheme();

  return (
    <Column style={{ width: 360, height: 800, backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <Box style={{
        height: 56,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
      }}>
        <Text
          text="Hello Skia Kit!"
          style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.onPrimary }}
        />
      </Box>

      {/* Card */}
      <Box style={{
        margin: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        elevation: 4,
        gap: 12,
      }}>
        <Text
          text="Rendered on Skia Canvas ⚡"
          style={{ fontSize: 16, color: theme.colors.textBody }}
        />
        <Button text="Get Started" color="primary" onPress={() => {}} />
      </Box>
    </Column>
  );
}

export default function App() {
  const { width, height } = useWindowDimensions();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CanvasRoot style={{ width, height }}>
        <HomeScreen />
      </CanvasRoot>
    </GestureHandlerRootView>
  );
}
```

## 🎨 Unified Style Prop API

Tất cả visual props được gom vào **`style` prop** duy nhất. Shorthand props (`color`, `variant`, `disabled`) giữ lại cho rapid development.

```tsx
// ✅ New API — style prop
<Box style={{ width: 200, height: 100, backgroundColor: '#fff', borderRadius: 12 }}>
  <Text text="Hello" style={{ fontSize: 16, fontWeight: 'bold' }} />
</Box>

// Shorthand props for UI components
<Button text="Submit" variant="solid" color="primary" />
<Chip label="Tag" variant="outline" color="info" />
<Badge value={5} color="error" />
```

### SemanticColor

UI components nhận `color` dưới dạng **SemanticColor** — không phải hex:

```ts
type SemanticColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
```

Custom hex → dùng `style.backgroundColor` hoặc `style.color`.

### Base Style Types

Defined in `src/types/style.types.ts`:

| Type | Props |
|------|-------|
| `LayoutStyle` | `width`, `height`, `overflow` |
| `SpacingStyle` | `padding`, `margin` |
| `ColorStyle` | `backgroundColor`, `opacity` |
| `BorderStyle` | `borderRadius`, `borderColor`, `borderWidth` |
| `ShadowStyle` | `elevation`, `zIndex` |
| `FlexChildStyle` | `flex`, `flexGrow`, `alignSelf`, `position`, `top/left/right/bottom` |
| `FlexContainerStyle` | `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`, `gap` |
| `SkiaTextStyle` | `fontSize`, `fontFamily`, `fontWeight`, `color`, `textAlign`, `lineHeight` |

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CanvasRoot                       │
│  ┌─────────────────────────────────────────────────┐│
│  │              @shopify/react-native-skia         ││
│  │                 (Single Canvas)                 ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │WidgetTree│ │ Yoga     │ │ Gesture  │             │
│  │ Store    │ │ Layout   │ │ Arena    │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Theme    │ │ Nav      │ │ Overlay  │             │
│  │ Store    │ │ Store    │ │ Store    │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                     │
│  Components: Box, Text, Button, Card, Modal...      │
│  Hooks: useTheme, useNav, useWidget, useAnimation   │
└─────────────────────────────────────────────────────┘
```

## 📋 Components (49)

### Layout (8)

| Component  | Flutter Equivalent      | Description                                  |
| ---------- | ----------------------- | -------------------------------------------- |
| `Box`      | `Container`             | Base container — background, border, padding |
| `Row`      | `Row`                   | Horizontal flex layout                       |
| `Column`   | `Column`                | Vertical flex layout                         |
| `Stack`    | `Stack` + `Positioned`  | Overlay / absolute positioning               |
| `Expanded` | `Expanded` + `Flexible` | Flex children                                |
| `Center`   | `Center`                | Center alignment                             |
| `Wrap`     | `Wrap`                  | Flow layout with auto-wrap                   |
| `Spacer`   | `SizedBox`              | Fixed spacing                                |

### Text & Input (3)

`Text` · `Input` · `SearchBar`

### Controls (7)

`Button` (6 variants: solid, outline, ghost, link, icon, fab) · `Checkbox` · `Radio` · `Switch` · `Slider` · `DropdownButton` · `PopupMenuButton`

### Display (10)

`Image` · `Icon` · `Card` · `Avatar` · `Badge` · `Chip` · `Divider` · `Tooltip` · `ListTile` · `ExpansionTile`

### Feedback (3)

`Progress` (linear/circular) · `SnackBar` · `RefreshIndicator`

### Navigation (5)

`Nav` · `AppBar` · `BottomNavigationBar` · `TabBar` · `Hero`

### Overlay (4)

`Modal` · `BottomSheet` · `Overlay` · `Drawer`

### Scroll & Pages (3)

`ScrollView` · `GridView` · `PageView`

### Gesture (3)

`GestureDetector` · `Dismissible` · `Draggable`

### Structure (3)

`CanvasRoot` · `Scaffold` · `Form`

> 📖 Full documentation: [`docs/components/`](./docs/components/README.md)

## 🪝 Hooks (8)

| Hook               | Purpose                        | Flutter Equivalent      |
| ------------------ | ------------------------------ | ----------------------- |
| `useWidget`        | Register widget in tree        | `createState()`         |
| `useWidgetId`      | Generate unique ID             | —                       |
| `useHitTest`       | Register touch area            | `hitTest()`             |
| `useYogaLayout`    | Compute flex layout            | `performLayout()`       |
| `useNav`           | Navigation (push, pop)         | `Navigator.of(context)` |
| `useTheme`         | Access theme colors/typography | `Theme.of(context)`     |
| `useScrollPhysics` | Scroll physics (bounce/clamp)  | `ScrollPhysics`         |
| `useAnimation`     | Animation controller           | `AnimationController`   |

> 📖 Full documentation: [`docs/hooks/`](./docs/hooks/README.md)

## 🎨 Theming

Built-in Light & Dark themes with Material 3 typography scale:

```tsx
import { useTheme, useThemeStore } from 'react-native-skia-kit';

// Access theme
const theme = useTheme();
theme.colors.primary      // '#1a73e8'
theme.typography.bodyLarge // { fontSize: 16, fontWeight: 'normal', lineHeight: 24 }
theme.spacing.md           // 16

// Switch theme
useThemeStore.getState().setActiveTheme('dark');

// Register custom theme
useThemeStore.getState().registerTheme('ocean', { ... });
```

### Theme Persistence (opt-in)

```tsx
import { enableThemePersistence } from 'react-native-skia-kit';

enableThemePersistence(); // Call once — saves active theme across app restarts
```

> 📖 Full documentation: [`docs/store-design/theme-store.md`](./docs/store-design/theme-store.md)

## 🗂 Stores (Zustand + Immer)

| Store                | Purpose                             |
| -------------------- | ----------------------------------- |
| `widgetStore`        | Widget tree management              |
| `eventStore`         | Touch event dispatching             |
| `layoutStore`        | Yoga layout computation             |
| `themeStore`         | Theme colors, typography, spacing   |
| `navStore`           | Navigation stack                    |
| `overlayStore`       | Modal, BottomSheet, Tooltip overlay |
| `heroStore`          | Shared element transitions          |
| `accessibilityStore` | Screen reader support               |

> 📖 Full documentation: [`docs/store-design/`](./docs/store-design/README.md)

## 🛠 Development

```sh
# Install dependencies
yarn install

# Run example app
yarn example start
yarn example android    # or: yarn example ios

# Type check
yarn typecheck

# Build package
yarn prepare

# Lint
yarn lint
```

## 📚 Documentation

```
docs/
├── components/     # 49 component specs
├── hooks/          # 8 hook specs
├── store-design/   # Store architecture
├── functions/      # Utility functions (DialogService, measureText)
└── plans/          # Implementation phases (1-14)
```

## 📄 License

MIT

This project depends on [`@shopify/react-native-skia`](https://github.com/Shopify/react-native-skia) which is licensed under [MIT License](https://github.com/Shopify/react-native-skia/blob/main/LICENSE.md).

---

## ☕ Support / Donate

If you find this project useful, consider buying me a coffee! ❤️

| Method | Details |
|--------|---------|
| 💳 Visa | `4848 0402 7693 5057` |
| 🏦 MB Bank (Vietnam) | `012032608` — **LE CONG TUAN** |

Thank you for your support! 🙏

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
