# Icon Component

## Mục đích
- Hiển thị biểu tượng (SVG path-based), hỗ trợ màu, kích thước, opacity.

## Flutter tương đương
- `Icon`, `IconData`

## Kiến trúc: Skia Path Node

> **Icon KHÔNG có Canvas riêng.** Icon là một `<Path>` (SVG path data) vẽ trực tiếp vào Canvas chung.

## TypeScript Interface

```ts
interface IconProps extends WidgetProps {
  x?: number;              // default: 0
  y?: number;              // default: 0
  name: string;            // REQUIRED — icon name từ iconMap
  size?: number;           // default: 24
  color?: string;          // default: theme.colors.textBody
  opacity?: number;        // default: 1
  onPress?: () => void;
  accessibilityLabel?: string;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `name` | `string` | — | ✅ | Tên icon |
| `size` | `number` | `24` | ❌ | Kích thước |
| `color` | `string` | `theme.textBody` | ❌ | Màu icon |
| `opacity` | `number` | `1` | ❌ | Độ mờ |
| `onPress` | `() => void` | — | ❌ | Tap callback |

## Built-in Icons

| Name | Path | Mô tả |
|------|------|-------|
| `star` | filled star | Ngôi sao |
| `arrow-right` | chevron right | Mũi tên phải |
| `user` | person outline | Người dùng |
| `close` | X mark | Đóng |
| `check` | checkmark | Dấu tích |
| `info` | circle i | Thông tin |

## Core Implementation

```tsx
import React from 'react';
import { Group, Path } from '@shopify/react-native-skia';
import { useTheme } from '../hooks/useTheme';

const iconMap: Record<string, string> = {
  'star':        'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'arrow-right': 'M10 6l6 6-6 6',
  'user':        'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
  'close':       'M18 6L6 18M6 6l12 12',
  'check':       'M5 13l4 4L19 7',
  'info':        'M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
};

export const Icon = React.memo(function Icon({
  x = 0, y = 0,
  name,
  size = 24,
  color,                   // undefined → theme.colors.textBody
  opacity = 1,
}: IconProps) {
  const theme = useTheme();
  const iconColor = color ?? theme.colors.textBody;
  const pathData = iconMap[name];
  const matrix = [size / 24, 0, 0, 0, size / 24, 0, x, y, 1];

  return (
    <Group opacity={opacity} matrix={matrix}>
      {pathData ? (
        <Path path={pathData} color={iconColor} style="stroke"
          strokeWidth={2} strokeCap="round" strokeJoin="round" />
      ) : (
        <Path path="M6 6l12 12M6 18L18 6" color={iconColor} style="stroke" strokeWidth={2} />
      )}
    </Group>
  );
});
```

## Cách dùng

```tsx
<CanvasRoot>
  <Icon x={16} y={100} name="star" size={32} color="gold" />
  <Icon x={56} y={100} name="user" size={24} color={theme.colors.textBody} />
</CanvasRoot>
```

### Trong Button
```tsx
<Button x={16} y={200} width={160} height={48} text="Yêu thích">
  <Icon x={24} y={212} name="star" size={20} color="white" />
</Button>
```

## Links
- Used by: [Button.md](./Button.md), [Badge.md](./Badge.md), [Checkbox.md](./Checkbox.md)
- Phase: [phase3_base_widget.md](../plans/phase3_base_widget.md)
