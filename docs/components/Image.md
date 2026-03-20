# Image Component

## Mục đích
- Hiển thị hình ảnh, hỗ trợ resizeMode, borderRadius, opacity, placeholder, lazy loading.

## Flutter tương đương
- `Image`, `Image.network`, `Image.asset`, `CachedNetworkImage`

## TypeScript Interface

```ts
interface ImageProps extends WidgetProps {
  x?: number;              // default: 0
  y?: number;              // default: 0
  width?: number;          // default: 120
  height?: number;         // default: 80
  src: string;             // REQUIRED — URL hoặc local path
  borderRadius?: number;   // default: 0
  opacity?: number;        // default: 1
  fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight'; // default: 'cover'
  placeholder?: React.ReactNode;
  onPress?: () => void;
  onError?: (e: Error) => void;
  onLoad?: () => void;
  accessibilityLabel?: string;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `width` | `number` | `120` | ❌ | Chiều rộng |
| `height` | `number` | `80` | ❌ | Chiều cao |
| `src` | `string` | — | ✅ | URL hoặc path |
| `borderRadius` | `number` | `0` | ❌ | Bo góc |
| `opacity` | `number` | `1` | ❌ | Độ mờ |
| `fit` | `string` | `'cover'` | ❌ | Resize mode |
| `onPress` | `() => void` | — | ❌ | Tap callback |
| `onLoad` | `() => void` | — | ❌ | Load complete callback |
| `onError` | `(e) => void` | — | ❌ | Load error callback |

## Kiến trúc: Skia Image Node

> **Image KHÔNG có Canvas riêng.** Image là một Skia `<Image>` (hoặc `<Group>` khi có clip/border) vẽ vào Canvas chung.

```
CanvasRoot (<Canvas>)
└── Image → <Group><Image .../></Group>  hoặc chỉ <Image .../> nếu không có border
```

## Core Skia Implementation

```tsx
import { Group, Image as SkiaImage, RoundedRect, useImage } from '@shopify/react-native-skia';

export function Image({
  x = 0, y = 0,
  width = 120, height = 80,
  src,
  borderRadius = 0,
  opacity = 1,
  fit = 'cover',       // 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight'
  placeholder,
}) {
  const image = useImage(src); // Lazy load — null khi chưa load xong

  if (!image) {
    // Placeholder: gray rect khi đang load
    return (
      <RoundedRect
        x={x} y={y} width={width} height={height}
        r={borderRadius} color="rgba(200,200,200,0.5)"
      />
    );
  }

  if (borderRadius > 0) {
    // Cần clip theo radius → dùng Group với clipRect
    return (
      <Group
        opacity={opacity}
        clip={{ x, y, width, height, rx: borderRadius, ry: borderRadius }}
      >
        <SkiaImage image={image} x={x} y={y} width={width} height={height} fit={fit} />
      </Group>
    );
  }

  // Không cần clip → vẽ trực tiếp
  return (
    <SkiaImage
      image={image}
      x={x} y={y}
      width={width} height={height}
      fit={fit}
      opacity={opacity}
    />
  );
}
```

## Cách dùng (trong CanvasRoot)
```tsx
<CanvasRoot>
  <Image x={16} y={100} width={120} height={80} src="https://..." borderRadius={8} />
  <Image x={148} y={100} width={60} height={60} src={userAvatar} borderRadius={30} />
</CanvasRoot>
```

## Links
- Used by: [Avatar.md](./Avatar.md)
- Store: [widget-store.md](../store-design/widget-store.md)
- Phase: [phase3_base_widget.md](../plans/phase3_base_widget.md)
