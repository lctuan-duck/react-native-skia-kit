# Stack Component

## Mục đích
- Xếp chồng children lên nhau (z-axis layering).
- Child đầu tiên ở dưới cùng, child cuối ở trên cùng.
- Dùng kèm `<Positioned>` để đặt vị trí tuyệt đối trong Stack.

## Flutter tương đương
- `Stack`, `Positioned`

## Kiến trúc: Box + Yoga absolute positioning

> **Stack = `<Box>`.** Children mặc định stretch toàn bộ Stack.
> `<Positioned>` = child với `position="absolute"` + top/left/right/bottom → Yoga xử lý.

## TypeScript Interface

```ts
interface StackProps extends WidgetProps {
  x?: number;
  y?: number;
  width: number;           // REQUIRED
  height: number;          // REQUIRED
  clipToBounds?: boolean;  // default: true
  children?: React.ReactNode;
}

interface PositionedProps {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width?: number;
  height?: number;
  children: React.ReactNode;
}
```

## Core Implementation

```tsx
import React from 'react';
import { Box } from './Box';

export const Stack = React.memo(function Stack({
  x = 0, y = 0,
  width, height,
  clipToBounds = true,
  children,
}: StackProps) {
  // Box sẽ gọi useYogaLayout nếu children có position="absolute"
  return (
    <Box x={x} y={y} width={width} height={height}
      clipToBounds={clipToBounds}
    >
      {children}
    </Box>
  );
});

// Positioned = Box wrapper với position="absolute"
export const Positioned = React.memo(function Positioned({
  top, bottom, left, right,
  width, height,
  children,
}: PositionedProps) {
  // Yoga xử lý position=absolute + top/left/right/bottom
  return (
    <Box
      position="absolute"
      top={top} bottom={bottom}
      left={left} right={right}
      width={width} height={height}
    >
      {children}
    </Box>
  );
});
```

> **Positioned dùng Yoga `position: absolute`** — không cần tính toán transform thủ công.
> Yoga engine tự tính x/y dựa trên top/left/right/bottom + parent size.

## Cách dùng

### Avatar + Badge overlay
```tsx
<Stack x={16} y={100} width={56} height={56}>
  <Avatar size={56} src={user.avatar} />
  <Positioned right={0} bottom={0}>
    <Badge value={3} size={20} />
  </Positioned>
</Stack>
```

### Image + gradient overlay + text
```tsx
<Stack x={0} y={0} width={360} height={200}>
  <Image width={360} height={200} src={hero} fit="cover" />
  <Positioned left={0} bottom={0} width={360} height={100}>
    <Box width={360} height={100} color="rgba(0,0,0,0.5)" />
  </Positioned>
  <Positioned left={16} bottom={16}>
    <Text text="Welcome Back" fontSize={24} fontWeight="bold" color="white" />
  </Positioned>
</Stack>
```

### Notification dot
```tsx
<Stack width={48} height={48}>
  <Center width={48} height={48}>
    <Icon name="shopping-cart" size={24} color={theme.colors.textBody} />
  </Center>
  <Positioned right={4} top={4}>
    <Box width={10} height={10} borderRadius={5} color={theme.colors.error} />
  </Positioned>
</Stack>
```

## Links
- Base: [Box.md](./Box.md)
- Related: [Row.md](./Row.md), [Column.md](./Column.md), [Center.md](./Center.md)
- Engine: [useYogaLayout.md](../hooks/useYogaLayout.md)
