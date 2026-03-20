# Avatar Component

## Mục đích
- Hiển thị hình đại diện, hỗ trợ 3 hình dạng + status indicator.

## Flutter tương đương
- `CircleAvatar`

## Kiến trúc: Composition (Tái sử dụng Image + Box)

> **Avatar KHÔNG vẽ Skia nguyên thủy.**
> Avatar = `<Image>` (với borderRadius tròn) + `<Box>` tròn nhỏ (status dot).

## TypeScript Interface

```ts
type AvatarVariant = 'circle' | 'rounded' | 'square';

interface AvatarProps extends WidgetProps {
  x?: number;
  y?: number;
  size?: number;           // default: 48
  variant?: AvatarVariant; // default: 'circle' — hình dạng
  src?: string;            // URL hoặc local path
  status?: 'online' | 'offline';
  color?: string;          // default: theme.colors.surfaceVariant
  onPress?: () => void;
}
```

## Variants (SHAPE only)

### `circle` (mặc định) — tròn
```tsx
<Avatar src={userAvatar} />
```

### `rounded` — bo góc vuông
```tsx
<Avatar variant="rounded" src={userAvatar} />
```

### `square` — vuông
```tsx
<Avatar variant="square" src={groupAvatar} />
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X (thống nhất Flutter) |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `size` | `number` | `48` | ❌ | Đường kính avatar |
| `src` | `string` | — | ❌ | URL hình ảnh |
| `status` | `'online' \| 'offline'` | — | ❌ | Trạng thái hiển thị |
| `color` | `string` | `theme.surfaceVariant` | ❌ | Màu nền placeholder |
| `onPress` | `() => void` | — | ❌ | Tap callback |

> **Note**: Đã chuyển từ `cx, cy` (tâm) sang `x, y` (top-left) để thống nhất Flutter convention. Tâm được tính tự động bên trong: `cx = x + size/2`, `cy = y + size/2`.

## Core Implementation (Composition + Store)

```tsx
import React from 'react';
import { Image } from './Image';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';

export const Avatar = React.memo(function Avatar({
  x = 0, y = 0,
  size = 48,
  variant = 'circle',
  src,
  status,
  color,
  onPress,
}: AvatarProps) {
  const theme = useTheme();
  const bgColor = color ?? theme.colors.surfaceVariant;
  const borderRadius = variant === 'circle' ? size / 2 : variant === 'rounded' ? size / 4 : 0;
  const dotSize = size * 0.28;
  const dotX = x + size - dotSize;
  const dotY = y + size - dotSize;

  useWidget<{ size: number; src?: string }>({ type: 'Avatar', layout: { x, y, width: size, height: size }, props: { size, src } });

  return (
    <Box
      x={x} y={y}
      width={size} height={size}
      borderRadius={borderRadius}
      color={bgColor}
      hitTestBehavior={onPress ? 'opaque' : 'deferToChild'}
      onPress={onPress}
    >
      {src && (
        <Image
          x={x + 2} y={y + 2}
          width={size - 4} height={size - 4}
          src={src}
          borderRadius={borderRadius}
          fit="cover"
        />
      )}

      {/* Status indicator */}
      {status === 'online' && (
        <Box x={dotX} y={dotY} width={dotSize} height={dotSize}
          borderRadius={dotSize / 2} color={theme.colors.success}
          borderWidth={2} borderColor={theme.colors.surface}
        />
      )}
      {status === 'offline' && (
        <Box x={dotX} y={dotY} width={dotSize} height={dotSize}
          borderRadius={dotSize / 2} color={theme.colors.textDisabled}
          borderWidth={2} borderColor={theme.colors.surface}
        />
      )}
    </Box>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<CanvasRoot>
  <Avatar x={16} y={100} size={64} src={userAvatar} status="online" />
  <Text x={88} y={116} text="Nguyễn Văn A" fontSize={16} fontWeight="bold" />
  <Text x={88} y={140} text="Đang hoạt động" fontSize={12} color={theme.colors.success} />
</CanvasRoot>
```

### Với onPress
```tsx
<Avatar x={16} y={100} size={48} src={avatar} onPress={() => navigateToProfile()} />
```

### Trong Card (danh sách chat)
```tsx
<Card x={16} y={100} width={328} height={72}>
  <Avatar x={32} y={114} size={44} src={contact.avatar} status="online" />
  <Text x={88} y={120} text={contact.name} fontSize={15} fontWeight="bold" />
  <Text x={88} y={142} text={contact.lastMessage} fontSize={13} color={theme.colors.textSecondary} />
</Card>
```

## Links
- Base: [Box.md](./Box.md), [Image.md](./Image.md)
- Store: [widget-store.md](../store-design/widget-store.md)
- Integration: [integration.md](../store-design/integration.md)
