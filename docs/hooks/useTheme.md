# useTheme Hook

## Mục đích
- Truy cập theme colors, typography, spacing từ `themeStore`.
- Components dùng hook này để lấy default colors, user override bằng props.

## Flutter tương đương
- `Theme.of(context)`, `ThemeData`

## API

```tsx
import { useTheme } from 'react-native-skia-kit';

function MyComponent() {
  const theme = useTheme();

  // === Colors ===
  theme.colors.primary          // '#1a73e8'
  theme.colors.primaryVariant   // '#e8f0fe'
  theme.colors.onPrimary        // '#ffffff'
  theme.colors.success          // '#16a34a'
  theme.colors.error            // '#dc2626'
  theme.colors.warning          // '#d97706'
  theme.colors.info             // '#0891b2'
  theme.colors.background       // '#ffffff'
  theme.colors.surface          // '#ffffff'
  theme.colors.textBody         // '#111827'
  theme.colors.textSecondary    // '#6b7280'
  theme.colors.border           // '#d1d5db'
  theme.colors.divider          // '#e5e7eb'

  // === Typography ===
  theme.typography.headlineMedium  // { fontSize: 20, fontWeight: '600', lineHeight: 28 }
  theme.typography.bodyMedium      // { fontSize: 14, fontWeight: 'normal', lineHeight: 20 }

  // === Spacing ===
  theme.spacing.md               // 16
  theme.spacing.lg               // 24

  // === BorderRadius ===
  theme.borderRadius.md          // 8
  theme.borderRadius.full        // 9999

  // === Elevation ===
  theme.elevation.md             // 4

  // === Mode ===
  theme.mode                     // 'light' | 'dark'

  // === Actions ===
  theme.setTheme('dark');
  theme.toggleTheme();
}
```

## Implementation

```ts
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const config = useThemeStore((s) => s.themeMap.get(s.activeTheme)!);
  const setActiveTheme = useThemeStore((s) => s.setActiveTheme);

  return {
    mode: config.mode,
    colors: config.colors,
    typography: config.typography,
    spacing: config.spacing,
    borderRadius: config.borderRadius,
    elevation: config.elevation,

    setTheme: (themeId: string) => setActiveTheme(themeId),
    toggleTheme: () => setActiveTheme(activeTheme === 'light' ? 'dark' : 'light'),
  };
}
```

## Pattern: Theme Default + Custom Override

```tsx
// Component nhận props (optional) → fallback về theme
function MyComponent({ color, textColor, ...props }) {
  const theme = useTheme();

  // ✅ User truyền color → dùng custom
  // ✅ Không truyền → dùng theme default
  const bgColor = color ?? theme.colors.primary;
  const fgColor = textColor ?? theme.colors.onPrimary;

  return (
    <Box color={bgColor}>
      <Text color={fgColor} text="Hello" />
    </Box>
  );
}

// Sử dụng:
<MyComponent />                       // → theme.colors.primary
<MyComponent color="#ff0000" />         // → custom red
<MyComponent color={theme.colors.success} />  // → theme success green
```

## Status color helpers

```tsx
function StatusBadge({ status, text }) {
  const theme = useTheme();

  // Map status → theme color
  const colorMap = {
    success: { bg: theme.colors.successVariant, text: theme.colors.success },
    error:   { bg: theme.colors.errorVariant,   text: theme.colors.error },
    warning: { bg: theme.colors.warningVariant,  text: theme.colors.warning },
    info:    { bg: theme.colors.infoVariant,     text: theme.colors.info },
  };

  const c = colorMap[status];
  return (
    <Box color={c.bg} borderRadius={12} padding={[4, 12, 4, 12]}>
      <Text text={text} color={c.text} fontSize={12} fontWeight="bold" />
    </Box>
  );
}

// Sử dụng:
<StatusBadge status="success" text="Thành công" />
<StatusBadge status="error" text="Thất bại" />
```

## Links
- Store: [theme-store.md](../store-design/theme-store.md)
- Used by: Tất cả components
