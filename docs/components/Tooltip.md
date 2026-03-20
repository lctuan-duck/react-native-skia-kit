# Tooltip Component

## Mục đích
- Hiển thị thông tin phụ khi hover/tap một element.

## Flutter tương đương
- `Tooltip`

## TypeScript Interface

```ts
interface TooltipProps extends WidgetProps {
  x?: number;              // default: 0
  y?: number;              // default: 0
  content: string;         // REQUIRED
  visible?: boolean;       // default: false
  position?: 'top' | 'bottom' | 'left' | 'right'; // default: 'top'
  width?: number;          // default: 120
  height?: number;         // default: 40
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `content` | `string` | — | ✅ | Nội dung tooltip |
| `visible` | `boolean` | `false` | ❌ | Hiển thị |
| `position` | `string` | `'top'` | ❌ | Vị trí mũi tên |
| `width` | `number` | `120` | ❌ | Chiều rộng |
| `height` | `number` | `40` | ❌ | Chiều cao |

## Kiến trúc: Composition (Tái sử dụng Box + Text) + Path

> **Tooltip KHÔNG phải Canvas riêng.** 
> Tooltip = Lớp overlay lắp ghép từ `<Box>` (popup) + `<Text>` (nội dung) + `<Path>` (mũi tên trỏ).
> Sắp xếp để render **cuối cùng** trên Canvas.

## Core Implementation

```tsx
import { Group, Path } from '@shopify/react-native-skia';
import { Box, Text } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit/hooks';

export function Tooltip({
  x = 0, y = 0,
  content,
  visible = false,
  position = 'top',
  width = 120, height = 40,
}) {
  if (!visible) return null;
  const theme = useTheme();

  const tooltipBg = theme.colors.inverseSurface;
  const arrowPath = position === 'top'
    ? `M${x + width / 2 - 6} ${y + height} L${x + width / 2} ${y + height + 8} L${x + width / 2 + 6} ${y + height}`
    : `M${x + width / 2 - 6} ${y} L${x + width / 2} ${y - 8} L${x + width / 2 + 6} ${y}`;

  return (
    <Group>
      <Box
        x={x} y={y}
        width={width} height={height}
        borderRadius={6}
        color={tooltipBg}
      >
        <Text
          x={x + 8}
          y={y + (height / 2) - 6.5}
          width={width - 16}
          text={content}
          fontSize={13}
          color={theme.colors.textInverse}
          textAlign="center"
        />
      </Box>
      
      {/* Arrow */}
      <Path path={arrowPath} color={tooltipBg} />
    </Group>
  );
}
```

## Cách dùng (trong CanvasRoot)
```tsx
<CanvasRoot>
  <Icon x={16} y={100} name="info" size={24} onPress={() => setTip(true)} />
  {/* Tooltip render ở cuối cùng để nổi lên trên các thành phần khác */}
  <Tooltip x={8} y={60} content="Thông tin chi tiết" visible={showTip} position="top" />
</CanvasRoot>
```

## Links
- Base: [Box.md](./Box.md), [Text.md](./Text.md)
- Store: [overlay-store.md](../store-design/overlay-store.md)
- Related: [Modal.md](./Modal.md)
