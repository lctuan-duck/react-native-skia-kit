# Drawer Component

## Mục đích
- Menu trượt từ cạnh màn hình (side menu), hỗ trợ animation.

## Flutter tương đương
- `Drawer`, `NavigationDrawer`

## TypeScript Interface

```ts
interface DrawerProps extends WidgetProps {
  visible?: boolean;         // default: false
  side?: 'left' | 'right';  // default: 'left'
  width?: number;            // default: 280
  screenHeight?: number;     // default: 800
  backgroundColor?: string;  // default: theme.colors.surface
  children?: React.ReactNode;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `visible` | `boolean` | `false` | ❌ | Hiển thị drawer |
| `side` | `'left' \| 'right'` | `'left'` | ❌ | Phía mở |
| `width` | `number` | `280` | ❌ | Chiều rộng |
| `screenHeight` | `number` | `800` | ❌ | Chiều cao màn hình |
| `backgroundColor` | `string` | `theme.surface` | ❌ | Màu nền |
| `children` | `ReactNode` | — | ❌ | Nội dung menu |

## Kiến trúc: Composition (Tái sử dụng Box) + Reanimated

> **Drawer KHÔNG vẽ Skia nguyên thủy.** 
> Drawer = Một `<Group transform>` bọc lấy một `<Box>` làm nền màu. Content bên trong Box đó do người dùng truyền vào bằng Props `children`.

## Core Implementation

```tsx
import { Group } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, useDerivedValue } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Box } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit/hooks';

export function Drawer({
  visible = false,
  side = 'left',
  width = 280,
  screenHeight = 800,
  backgroundColor,        // undefined → theme.colors.surface
  children,
}) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.surface;
  const translateX = useSharedValue(side === 'left' ? -width : width);

  useEffect(() => {
    translateX.value = withTiming(visible ? 0 : (side === 'left' ? -width : width), {
      duration: 280,
    });
  }, [visible]);

  const transform = useDerivedValue(() => [{ translateX: translateX.value }]);

  return (
    <Group transform={transform}>
      {/* Drawer background bằng Base Component Box */}
      <Box
        x={0} y={0}
        width={width} height={screenHeight}
        borderRadius={0}
        color={bgColor}
        elevation={16} // Đổ bóng nhẹ tràn ra ngoài để phân tách với Overlay
        hitTestBehavior="opaque" // Chặn không cho bấm xuyên qua Drawer
      >
        {/* Drawer content (các Button, Image, Text...) */}
        {children}
      </Box>
    </Group>
  );
}
```

## Cách dùng (trong CanvasRoot)
```tsx
<CanvasRoot>
  {/* Screen nội dung... */}
  
  {/* Overlay đặt TRƯỚC Drawer trong cây render */}
  <Overlay visible={open} onPress={() => setOpen(false)} />
  
  {/* Drawer đặt SAU Overlay — nên vẽ đè lên trên */}
  <Drawer visible={open} width={280}>
    <Text x={16} y={32} text="Menu" fontSize={20} fontWeight="bold" />
    <Button x={0} y={72} width={280} text="Home" />
  </Drawer>
</CanvasRoot>
```

## Links
- Base: [Box.md](./Box.md)
- Related: [Overlay.md](./Overlay.md), [Modal.md](./Modal.md)
- Store: [overlay-store.md](../store-design/overlay-store.md)
- Animation: [phase8_animation.md](../plans/phase8_animation.md)
