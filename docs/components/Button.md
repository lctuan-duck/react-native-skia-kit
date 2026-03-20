# Button Component

## Mục đích
- Nút bấm đa dạng style qua `variant` và màu qua `color`.
- **Variant** = hình dạng/style (fill, border, shadow) — KHÔNG liên quan đến màu.
- **Color** = ngữ nghĩa (primary, error, success) — KHÔNG liên quan đến variant.
- 2 trục này **độc lập** → kết hợp tự do.

## Flutter tương đương
- `FilledButton`, `FilledButton.ghost`, `ElevatedButton`, `OutlinedButton`, `TextButton`, `IconButton`, `FloatingActionButton`

## Nguyên tắc: Variant ≠ Color

```
        ┌─── variant (SHAPE) ──────────────────────────────┐
        │ filled │ ghost │ elevated │ outlined │ text      │
  ┌─────┼────────┼───────┼──────────┼──────────┼───────────┤
  │ pri │ ██████ │ ░░░░░ │ ▓▓▓▓▓▓▓ │ ┌──────┐ │   Text   │  ← color = primary (default)
  │ err │ ██████ │ ░░░░░ │ ▓▓▓▓▓▓▓ │ ┌──────┐ │   Text   │  ← color = error
  │ suc │ ██████ │ ░░░░░ │ ▓▓▓▓▓▓▓ │ ┌──────┐ │   Text   │  ← color = success
  │ cus │ ██████ │ ░░░░░ │ ▓▓▓▓▓▓▓ │ ┌──────┐ │   Text   │  ← color = custom
  └─────┴────────┴───────┴──────────┴──────────┴───────────┘
```

## TypeScript Interface

```ts
type ButtonVariant = 'filled' | 'ghost' | 'elevated' | 'outlined' | 'text' | 'icon' | 'fab';

interface ButtonProps extends WidgetProps {
  // Layout
  x?: number;
  y?: number;
  width?: number;
  height?: number;            // default: 48

  // Content
  text?: string;              // label text
  icon?: string;              // icon name (khi có cả text+icon → icon bên trái)
  iconSize?: number;          // default: 20

  // Style — 2 trục độc lập
  variant?: ButtonVariant;    // default: 'filled' — hình dạng
  color?: string;             // default: theme.colors.primary — màu chủ đạo
  textColor?: string;         // default: auto (trắng trên filled, color trên outlined/text)
  borderRadius?: number;      // default: 8
  disabled?: boolean;

  // FAB specific
  extended?: boolean;         // FAB extended (icon + label)

  // Icon Button specific
  tapSize?: number;           // default: 48

  // Callbacks
  onPress?: () => void;
  onLongPress?: () => void;
}
```

## Variants (chỉ về SHAPE)

### `filled` (mặc định) — nền đặc
Nền = `color`, text = contrast (trắng/đen tùy nền).
```tsx
<Button text="Đăng nhập" onPress={login} />
```

### `ghost` — nền nhạt
Nền = `color` pha nhạt (20% opacity), text = `color`.
```tsx
<Button variant="ghost" text="Lưu nháp" onPress={saveDraft} />
```

### `elevated` — nền surface + bóng đổ
Nền = surface, text = `color`, elevation cao.
```tsx
<Button variant="elevated" text="Thêm" icon="plus" onPress={add} />
```

### `outlined` — chỉ viền
Nền = transparent, viền = `color`, text = `color`.
```tsx
<Button variant="outlined" text="Hủy" onPress={cancel} />
```

### `text` — chỉ text
Không nền, không viền, text = `color`.
```tsx
<Button variant="text" text="Quên mật khẩu?" onPress={forgot} />
```

### `icon` — chỉ icon
Icon = `color`, tròn, area mở rộng.
```tsx
<Button variant="icon" icon="heart" onPress={like} />
```

### `fab` — nút nổi tròn
Nền = `color`, icon/text = contrast.
```tsx
<Button variant="fab" icon="add" onPress={create} />
<Button variant="fab" icon="add" text="Tạo mới" extended onPress={create} />
```

## Core Implementation

```tsx
import React from 'react';
import { Box, Text, Icon } from 'react-native-skia-kit';
import { useWidget } from 'react-native-skia-kit/hooks';
import { useTheme } from 'react-native-skia-kit/hooks';

export const Button = React.memo(function Button({
  x, y,
  width, height = 48,
  text, icon, iconSize = 20,
  variant = 'filled',
  color,           // undefined → theme.colors.primary
  textColor,       // undefined → auto từ variant
  borderRadius = 8,
  disabled = false,
  extended = false,
  tapSize = 48,
  onPress,
  onLongPress,
}: ButtonProps) {
  const theme = useTheme();

  // Resolve color: custom → theme.primary
  const resolvedColor = color ?? theme.colors.primary;

  // Variant quyết định SHAPE, color quyết định MÀU
  const styles = resolveStyles(variant, resolvedColor, textColor, theme);

  const widgetId = useWidget<{ variant: string }>({
    type: 'Button',
    layout: { x: x ?? 0, y: y ?? 0, width: width ?? 100, height },
    props: { variant },
  });

  // ===== Icon-only variant =====
  if (variant === 'icon') {
    return (
      <Box
        x={x} y={y}
        width={tapSize} height={tapSize}
        borderRadius={tapSize / 2}
        color="transparent"
        hitTestBehavior="opaque"
        onPress={() => !disabled && onPress?.()}
        opacity={disabled ? 0.4 : 1}
        flexDirection="column" justifyContent="center" alignItems="center"
      >
        <Icon name={icon!} size={iconSize} color={styles.foreground} />
      </Box>
    );
  }

  // ===== FAB variant =====
  if (variant === 'fab') {
    const fabSize = extended ? undefined : 56;
    return (
      <Box
        x={x} y={y}
        width={fabSize} height={56}
        borderRadius={28}
        color={styles.background} elevation={6}
        hitTestBehavior="opaque" onPress={() => !disabled && onPress?.()}
        flexDirection="row" alignItems="center" justifyContent="center"
        padding={extended ? [0, 20, 0, 16] : 0}
        gap={extended ? 8 : 0}
        opacity={disabled ? 0.4 : 1}
      >
        <Icon name={icon!} size={24} color={styles.foreground} />
        {extended && text && (
          <Text text={text} fontSize={14} fontWeight="bold" color={styles.foreground} />
        )}
      </Box>
    );
  }

  // ===== filled / ghost / elevated / outlined / text =====
  return (
    <Box
      x={x} y={y}
      width={width} height={height}
      borderRadius={borderRadius}
      color={styles.background}
      borderWidth={styles.borderWidth}
      borderColor={styles.borderColor}
      elevation={styles.elevation}
      hitTestBehavior="opaque"
      onPress={() => !disabled && onPress?.()}
      onLongPress={onLongPress}
      opacity={disabled ? 0.4 : 1}
      flexDirection="row" alignItems="center" justifyContent="center"
      gap={icon && text ? 8 : 0}
      padding={[0, 16, 0, 16]}
    >
      {icon && <Icon name={icon} size={iconSize} color={styles.foreground} />}
      {text && (
        <Text text={text} fontSize={14} fontWeight="bold" color={styles.foreground} />
      )}
    </Box>
  );
});

// Variant = SHAPE, color = MÀU → 2 trục độc lập
function resolveStyles(
  variant: ButtonVariant,
  color: string,
  customTextColor: string | undefined,
  theme: ReturnType<typeof useTheme>,
) {
  const c = theme.colors;

  switch (variant) {
    case 'filled':
      return {
        background: color,
        foreground: customTextColor ?? contrastColor(color),
        elevation: 2, borderWidth: 0, borderColor: 'transparent',
      };

    case 'ghost':
      return {
        background: withOpacity(color, 0.15),  // color pha nhạt
        foreground: customTextColor ?? color,
        elevation: 0, borderWidth: 0, borderColor: 'transparent',
      };

    case 'elevated':
      return {
        background: c.surface,
        foreground: customTextColor ?? color,
        elevation: 4, borderWidth: 0, borderColor: 'transparent',
      };

    case 'outlined':
      return {
        background: 'transparent',
        foreground: customTextColor ?? color,
        elevation: 0, borderWidth: 1, borderColor: color,
      };

    case 'text':
      return {
        background: 'transparent',
        foreground: customTextColor ?? color,
        elevation: 0, borderWidth: 0, borderColor: 'transparent',
      };

    case 'icon':
      return {
        background: 'transparent',
        foreground: customTextColor ?? color,
        elevation: 0, borderWidth: 0, borderColor: 'transparent',
      };

    case 'fab':
      return {
        background: color,
        foreground: customTextColor ?? contrastColor(color),
        elevation: 6, borderWidth: 0, borderColor: 'transparent',
      };

    default:
      return {
        background: color,
        foreground: customTextColor ?? contrastColor(color),
        elevation: 2, borderWidth: 0, borderColor: 'transparent',
      };
  }
}

// Tự chọn text trắng/đen dựa trên luminance của background
function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Pha nhạt color (cho ghost)
function withOpacity(hex: string, opacity: number): string {
  return hex + Math.round(opacity * 255).toString(16).padStart(2, '0');
}
```

## Cách dùng: Variant × Color

### Variant giống nhau, color khác nhau
```tsx
// Tất cả đều variant="filled", color khác nhau
<Button text="Lưu" />                                      // primary (mặc định)
<Button text="Xóa" color={theme.colors.error} />            // đỏ
<Button text="Hoàn thành" color={theme.colors.success} />   // xanh lá
<Button text="Cảnh báo" color={theme.colors.warning} />     // vàng cam
```

### Color giống nhau, variant khác nhau
```tsx
// Tất cả đều color=error (đỏ), variant khác nhau
<Button text="Xóa"   color={theme.colors.error} />                           // filled đỏ
<Button text="Xóa"   color={theme.colors.error} variant="tonal" />           // nền đỏ nhạt
<Button text="Xóa"   color={theme.colors.error} variant="outlined" />        // viền đỏ
<Button text="Xóa"   color={theme.colors.error} variant="text" />            // text đỏ
<Button variant="icon" icon="trash" color={theme.colors.error} />            // icon đỏ
```

### Form buttons
```tsx
<Row gap={8} mainAxisAlignment="end">
  <Button variant="text" text="Hủy" onPress={cancel} />
  <Button variant="tonal" text="Lưu nháp" onPress={saveDraft} />
  <Button text="Gửi" icon="send" onPress={submit} />
</Row>
```

### Destructive action (dùng color, không phải variant)
```tsx
<Row gap={8}>
  <Button variant="outlined" text="Hủy" onPress={cancel} />
  <Button text="Xóa tài khoản" color={theme.colors.error} icon="trash" onPress={del} />
</Row>
```

### AppBar actions
```tsx
<AppBar title="Chat" actions={[
  <Button variant="icon" icon="search" color="white" onPress={search} />,
  <Button variant="icon" icon="more" color="white" onPress={menu} />,
]} />
```

## Links
- Base: [Box.md](./Box.md), [Icon.md](./Icon.md), [Text.md](./Text.md)
- Theme: [useTheme.md](../hooks/useTheme.md), [theme-store.md](../store-design/theme-store.md)
