# Theme Store Design

## Mục đích
- Quản lý theme toàn cục: colors, typography, spacing, borderRadius.
- Components sử dụng theme colors làm defaults, user override bằng props.
- Hỗ trợ light/dark/custom themes.

## Flutter tương đương
- `ThemeData`, `ColorScheme`, `Theme.of(context)`

## Color System

> Lấy cảm hứng từ Material 3 ColorScheme + mở rộng cho status colors.

### Color Token Map

```
┌─────────────────────────────────────────────────────────┐
│  CORE COLORS (brand identity)                           │
│  ┌─────────┐  ┌───────────┐  ┌──────────┐              │
│  │ primary │  │ secondary │  │ tertiary │              │
│  │ #1a73e8 │  │ #5f6368   │  │ #7c3aed  │              │
│  └─────────┘  └───────────┘  └──────────┘              │
│                                                         │
│  STATUS COLORS (semantic meaning)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  │
│  │ success │  │  error  │  │ warning │  │   info   │  │
│  │ #16a34a │  │ #dc2626 │  │ #d97706 │  │ #0891b2  │  │
│  └─────────┘  └─────────┘  └─────────┘  └──────────┘  │
│                                                         │
│  SURFACE COLORS (backgrounds)                           │
│  ┌────────────┐  ┌─────────┐  ┌────────────────┐       │
│  │ background │  │ surface │  │ surfaceVariant │       │
│  │ #ffffff    │  │ #f8f9fa │  │ #f3f4f6        │       │
│  └────────────┘  └─────────┘  └────────────────┘       │
│                                                         │
│  TEXT COLORS (readability)                               │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │ textBody │  │ textSecondary │  │ textDisabled │     │
│  │ #111827  │  │ #6b7280       │  │ #d1d5db      │     │
│  └──────────┘  └───────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## TypeScript Interface

```ts
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  // === Core ===
  primary: string;             // Brand chính
  primaryVariant: string;      // Brand nhạt (hover, container)
  onPrimary: string;           // Text/Icon trên primary
  secondary: string;           // Brand phụ
  secondaryVariant: string;
  onSecondary: string;
  tertiary: string;            // Accent thứ 3
  onTertiary: string;

  // === Status ===
  success: string;             // Thành công, hoàn thành
  successVariant: string;      // Background nhạt cho success
  onSuccess: string;           // Text trên success
  error: string;               // Lỗi, nguy hiểm
  errorVariant: string;
  onError: string;
  warning: string;             // Cảnh báo
  warningVariant: string;
  onWarning: string;
  info: string;                // Thông tin
  infoVariant: string;
  onInfo: string;

  // === Surface ===
  background: string;          // Nền chính
  surface: string;             // Nền card, modal
  surfaceVariant: string;      // Nền input, chip, badge
  inverseSurface: string;      // Nền tooltip, snackbar

  // === Text ===
  textBody: string;            // Text chính
  textSecondary: string;       // Text phụ, mô tả
  textDisabled: string;        // Text disabled
  textInverse: string;         // Text trên inverseSurface
  textLink: string;            // Text link

  // === Border / Divider ===
  border: string;              // Border input, card
  borderFocused: string;       // Border khi focus
  divider: string;             // Divider, separator
  outline: string;             // Outline button

  // === State ===
  disabled: string;            // Background disabled
  overlay: string;             // Modal/BottomSheet overlay
  shadow: string;              // Box shadow color
  ripple: string;              // Ripple effect
}

interface TextStyle {
  fontSize: number;
  fontWeight: string;        // 'normal' | 'bold' | '100'-'900'
  lineHeight: number;
  letterSpacing?: number;    // Material 3 tracking
  fontFamily?: string;       // Override cho style cụ thể
}

interface ThemeTypography {
  fontFamily: string;        // Font mặc định cho toàn app
  displayLarge: TextStyle;
  displayMedium: TextStyle;
  headlineLarge: TextStyle;
  headlineMedium: TextStyle;
  titleLarge: TextStyle;
  titleMedium: TextStyle;
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  labelLarge: TextStyle;
  labelMedium: TextStyle;
  caption: TextStyle;
}

interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  borderRadius: { xs: number; sm: number; md: number; lg: number; xl: number; full: number };
  elevation: { none: number; sm: number; md: number; lg: number; xl: number };
}

interface ThemeStore {
  themeMap: Map<string, ThemeConfig>;
  activeTheme: string;

  registerTheme: (themeId: string, config: ThemeConfig) => void;
  setActiveTheme: (themeId: string) => void;
  getConfig: () => ThemeConfig;
  getColors: () => ThemeColors;
}
```

## Default Themes

### Light Theme

```ts
const lightColors: ThemeColors = {
  // Core
  primary: '#1a73e8',
  primaryVariant: '#e8f0fe',
  onPrimary: '#ffffff',
  secondary: '#5f6368',
  secondaryVariant: '#e8eaed',
  onSecondary: '#ffffff',
  tertiary: '#7c3aed',
  onTertiary: '#ffffff',

  // Status
  success: '#16a34a',
  successVariant: '#dcfce7',
  onSuccess: '#ffffff',
  error: '#dc2626',
  errorVariant: '#fee2e2',
  onError: '#ffffff',
  warning: '#d97706',
  warningVariant: '#fef3c7',
  onWarning: '#ffffff',
  info: '#0891b2',
  infoVariant: '#cffafe',
  onInfo: '#ffffff',

  // Surface
  background: '#ffffff',
  surface: '#ffffff',
  surfaceVariant: '#f3f4f6',
  inverseSurface: '#1f2937',

  // Text
  textBody: '#111827',
  textSecondary: '#6b7280',
  textDisabled: '#d1d5db',
  textInverse: '#f9fafb',
  textLink: '#1a73e8',

  // Border
  border: '#d1d5db',
  borderFocused: '#1a73e8',
  divider: '#e5e7eb',
  outline: '#9ca3af',

  // State
  disabled: '#f3f4f6',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(0,0,0,0.15)',
  ripple: 'rgba(0,0,0,0.12)',
};
```

### Dark Theme

```ts
const darkColors: ThemeColors = {
  // Core
  primary: '#8ab4f8',
  primaryVariant: '#1e3a5f',
  onPrimary: '#1e1e1e',
  secondary: '#9aa0a6',
  secondaryVariant: '#3c4043',
  onSecondary: '#1e1e1e',
  tertiary: '#a78bfa',
  onTertiary: '#1e1e1e',

  // Status
  success: '#4ade80',
  successVariant: '#14532d',
  onSuccess: '#1e1e1e',
  error: '#f87171',
  errorVariant: '#7f1d1d',
  onError: '#1e1e1e',
  warning: '#fbbf24',
  warningVariant: '#78350f',
  onWarning: '#1e1e1e',
  info: '#22d3ee',
  infoVariant: '#164e63',
  onInfo: '#1e1e1e',

  // Surface
  background: '#121212',
  surface: '#1e1e1e',
  surfaceVariant: '#2d2d2d',
  inverseSurface: '#e5e7eb',

  // Text
  textBody: '#e5e7eb',
  textSecondary: '#9ca3af',
  textDisabled: '#4b5563',
  textInverse: '#1f2937',
  textLink: '#8ab4f8',

  // Border
  border: '#4b5563',
  borderFocused: '#8ab4f8',
  divider: '#374151',
  outline: '#6b7280',

  // State
  disabled: '#374151',
  overlay: 'rgba(0,0,0,0.7)',
  shadow: 'rgba(0,0,0,0.4)',
  ripple: 'rgba(255,255,255,0.12)',
};
```

### Typography (shared)

```ts
const defaultTypography: ThemeTypography = {
  fontFamily: 'System',      // RN default — tự chọn SF Pro (iOS) / Roboto (Android)
  displayLarge:   { fontSize: 32, fontWeight: 'bold',   lineHeight: 40, letterSpacing: -0.5 },
  displayMedium:  { fontSize: 28, fontWeight: 'bold',   lineHeight: 36, letterSpacing: 0 },
  headlineLarge:  { fontSize: 24, fontWeight: 'bold',   lineHeight: 32, letterSpacing: 0 },
  headlineMedium: { fontSize: 20, fontWeight: '600',    lineHeight: 28, letterSpacing: 0.15 },
  titleLarge:     { fontSize: 18, fontWeight: '600',    lineHeight: 24, letterSpacing: 0 },
  titleMedium:    { fontSize: 16, fontWeight: '600',    lineHeight: 22, letterSpacing: 0.15 },
  bodyLarge:      { fontSize: 16, fontWeight: 'normal', lineHeight: 24, letterSpacing: 0.5 },
  bodyMedium:     { fontSize: 14, fontWeight: 'normal', lineHeight: 20, letterSpacing: 0.25 },
  bodySmall:      { fontSize: 12, fontWeight: 'normal', lineHeight: 16, letterSpacing: 0.4 },
  labelLarge:     { fontSize: 14, fontWeight: '600',    lineHeight: 20, letterSpacing: 0.1 },
  labelMedium:    { fontSize: 12, fontWeight: '600',    lineHeight: 16, letterSpacing: 0.5 },
  caption:        { fontSize: 11, fontWeight: 'normal', lineHeight: 14, letterSpacing: 0.4 },
};
```

### Spacing & BorderRadius

```ts
const defaultSpacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const defaultBorderRadius = { xs: 2, sm: 4, md: 8, lg: 16, xl: 24, full: 9999 };
const defaultElevation = { none: 0, sm: 2, md: 4, lg: 8, xl: 16 };
```

## Store Implementation

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
enableMapSet();

export const useThemeStore = create<ThemeStore>()(immer((set, get) => ({
  themeMap: new Map([
    ['light', { mode: 'light', colors: lightColors, typography: defaultTypography, spacing: defaultSpacing, borderRadius: defaultBorderRadius, elevation: defaultElevation }],
    ['dark',  { mode: 'dark',  colors: darkColors,  typography: defaultTypography, spacing: defaultSpacing, borderRadius: defaultBorderRadius, elevation: defaultElevation }],
  ]),
  activeTheme: 'light',

  registerTheme: (themeId, config) => set((state) => {
    state.themeMap.set(themeId, config);
  }),

  setActiveTheme: (themeId) => set((state) => {
    state.activeTheme = themeId;
  }),

  getConfig: () => {
    const state = get();
    return state.themeMap.get(state.activeTheme)!;
  },

  getColors: () => {
    const state = get();
    return state.themeMap.get(state.activeTheme)!.colors;
  },
})));
```

## Component Theming Pattern

### Quy tắc: theme defaults + custom override

```tsx
// Component nhận color prop (optional) → fallback về theme
function Button({ color, textColor, ...props }) {
  const theme = useTheme();

  // custom color → dùng custom
  // không truyền → dùng theme.colors.primary
  const bgColor = color ?? theme.colors.primary;
  const fgColor = textColor ?? theme.colors.onPrimary;

  return <Box color={bgColor}><Text color={fgColor} /></Box>;
}
```

### Component ↔ Theme Color Mapping

| Component | Theme Default Color | Có thể override? |
|-----------|-------------------|:-:|
| **Button** (mọi variant) | `primary` (bg/fg tùy variant) | ✅ `color` — thay đổi tất cả |
| **Button** `filled`/`fab` | nền = `color`, text = contrast auto | ✅ `color`, `textColor` |
| **Button** `ghost` | nền = `color` pha nhạt, text = `color` | ✅ `color`, `textColor` |
| **Button** `elevated` | nền = `surface`, text = `color` | ✅ `color`, `textColor` |
| **Button** `outlined` | viền = `color`, text = `color` | ✅ `color`, `textColor` |
| **Button** `text`/`icon` | text/icon = `color` | ✅ `color`, `textColor` |
| **Card** | `surface` | ✅ `backgroundColor` |
| **Input** | `surfaceVariant` + `border` / `borderFocused` | ✅ |
| **AppBar** | `primary` / `onPrimary` | ✅ `backgroundColor`, `foregroundColor` |
| **BottomNavigationBar** | `surface` / `primary` / `textSecondary` | ✅ |
| **TabBar** | `surface` / `primary` / `textSecondary` | ✅ |
| **Badge** | `error` / `onError` | ✅ `color` |
| **Chip** | `surfaceVariant` / `textBody` | ✅ |
| **Divider** | `divider` | ✅ `color` |
| **Modal overlay** | `overlay` | ✅ |
| **SnackBar** | `inverseSurface` / `textInverse` | ✅ |
| **Tooltip** | `inverseSurface` / `textInverse` | ✅ |
| **Progress** | `primary` / `surfaceVariant` (track) | ✅ `color`, `trackColor` |
| **Switch** on | `primary` | ✅ `activeColor` |
| **Checkbox** checked | `primary` | ✅ `activeColor` |
| **Text** | `textBody` | ✅ `color` |
| **Icon** | `textSecondary` | ✅ `color` |

## Links
- Hook: [useTheme.md](../hooks/useTheme.md)
- Integration: [integration.md](./integration.md)
- Components: Tất cả components sử dụng ThemeStore
