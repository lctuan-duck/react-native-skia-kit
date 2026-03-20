# Box Component

## Mục đích
- Container hoặc khối UI cơ bản (tương đương `Container`/`DecoratedBox` của Flutter).
- Hỗ trợ layout, style, flex, padding, margin, background, border, opacity, zIndex.
- Có thể chứa children (cũng là Skia nodes).
- **Là base component cốt lõi** — hầu hết component khác đều compose từ Box.

## Flutter tương đương
- `Container`, `DecoratedBox`, `SizedBox`, `Padding`

## Kiến trúc: Skia Group Node

> **Box KHÔNG có Canvas riêng.** Box là một `<Group>` chứa `<RoundedRect>` + children, tất cả vẽ vào Canvas chung của `CanvasRoot`.

```
CanvasRoot (<Canvas>)
└── Box → <Group>
    ├── <RoundedRect>  ← background
    └── children       ← các Skia node con
```

## HitTestBehavior
- Mặc định: **`deferToChild`** — Box chỉ nhận event nếu child nhận event.
- Xem chi tiết: [event-store.md](../store-design/event-store.md), [integration.md](../store-design/integration.md)

## TypeScript Interface

```ts
interface BoxProps extends WidgetProps {
  // Layout (tính bởi Yoga, inject từ layoutStore)
  x?: number;              // default: 0
  y?: number;              // default: 0
  width?: number;          // default: 100
  height?: number;         // default: 100

  // Style
  color?: string;          // default: 'transparent'
  borderRadius?: number;   // default: 0
  borderWidth?: number;    // default: 0
  borderColor?: string;    // default: 'transparent'
  opacity?: number;        // default: 1
  elevation?: number;      // default: 0

  // Flex (truyền vào Yoga.Node → useYogaLayout xử lý)
  flex?: number;
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  gap?: number;
  rowGap?: number;           // gap dọc (khi flexWrap)
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | 'auto';
  padding?: number | [number, number, number, number]; // [top, right, bottom, left]
  margin?: number | [number, number, number, number];
  position?: 'relative' | 'absolute';  // cho Stack/Positioned
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;

  // Children
  children?: React.ReactNode;

  // Events
  onPress?: () => void;
  onLongPress?: () => void;
  onPanStart?: (e: GestureEvent) => void;
  onPanUpdate?: (e: GestureEvent) => void;
  onPanEnd?: (e: GestureEvent) => void;
  onLayout?: (layout: LayoutRect) => void;

  // Hit Test
  hitTestBehavior?: HitTestBehavior; // default: 'deferToChild'
  zIndex?: number;                   // default: 0

  // Accessibility
  accessibilityLabel?: string;
  accessibilityRole?: string;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X position |
| `y` | `number` | `0` | ❌ | Top-left Y position |
| `width` | `number` | `100` | ❌ | Chiều rộng |
| `height` | `number` | `100` | ❌ | Chiều cao |
| `color` | `string` | `'transparent'` | ❌ | Màu nền |
| `borderRadius` | `number` | `0` | ❌ | Bo góc |
| `borderWidth` | `number` | `0` | ❌ | Độ dày viền |
| `borderColor` | `string` | `'transparent'` | ❌ | Màu viền |
| `opacity` | `number` | `1` | ❌ | Độ mờ (0–1) |
| `elevation` | `number` | `0` | ❌ | Đổ bóng (shadow) |
| `hitTestBehavior` | `HitTestBehavior` | `'deferToChild'` | ❌ | Chế độ hit test |
| `children` | `ReactNode` | — | ❌ | Skia nodes con |
| `onPress` | `() => void` | — | ❌ | Tap callback |
| `onLongPress` | `() => void` | — | ❌ | Long press callback |
| `onPanStart` | `(e) => void` | — | ❌ | Pan start callback |
| `onPanUpdate` | `(e) => void` | — | ❌ | Pan update callback |
| `onPanEnd` | `(e) => void` | — | ❌ | Pan end callback |
| `accessibilityLabel` | `string` | — | ❌ | Screen reader label |

## Core Implementation (với Store + Yoga Integration)

```tsx
import { Group, RoundedRect, Paint, Shadow } from '@shopify/react-native-skia';
import React from 'react';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useYogaLayout } from '../hooks/useYogaLayout';

export const Box = React.memo(function Box({
  x = 0, y = 0,
  width = 100, height = 100,
  color = 'transparent',
  borderRadius = 0,
  borderWidth = 0,
  borderColor = 'transparent',
  opacity = 1,
  elevation = 0,
  hitTestBehavior = 'deferToChild',
  zIndex = 0,
  children,
  onPress,
  onLongPress,
  onPanStart,
  onPanUpdate,
  onPanEnd,
  accessibilityLabel,
  accessibilityRole,
  // === Yoga Flex Props ===
  flexDirection,
  justifyContent,
  alignItems,
  alignSelf,
  gap,
  flex: flexValue,
  flexGrow,
  flexShrink,
  padding,
  margin,
  position,
  top, left, right, bottom,
}: BoxProps) {
  // === Widget + Hit Test registration ===
  const widgetId = useWidget<{ color: string; borderRadius: number }>({
    type: 'Box',
    layout: { x, y, width, height },
    props: { color, borderRadius },
  });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: { onPress, onLongPress, onPanStart, onPanUpdate, onPanEnd },
    behavior: hitTestBehavior,
    zIndex,
  });

  // === Yoga Layout: chỉ chạy khi Box có flex props ===
  const hasFlexProps = !!(flexDirection || justifyContent || alignItems || gap != null);

  const computedChildLayouts = hasFlexProps
    ? useYogaLayout(widgetId, { x, y, width, height }, {
        flexDirection, justifyContent, alignItems, gap, padding,
      }, children)
    : null;

  // === Inject computed layout vào children ===
  const renderedChildren = hasFlexProps && computedChildLayouts
    ? React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child) || !computedChildLayouts[i]) return child;
        const cl = computedChildLayouts[i];
        // Clone child với x, y, width, height từ Yoga
        return React.cloneElement(child as React.ReactElement<any>, {
          x: cl.x,
          y: cl.y,
          width: child.props.width ?? cl.width,   // child width override nếu có
          height: child.props.height ?? cl.height, // child height override nếu có
        });
      })
    : children; // Không có flex → render children nguyên bản (x, y thủ công)

  // === Skia Rendering ===
  return (
    <Group opacity={opacity}>
      {/* Shadow layer nếu có elevation */}
      {elevation > 0 && (
        <RoundedRect x={x} y={y} width={width} height={height} r={borderRadius} color="transparent">
          <Paint>
            <Shadow dx={0} dy={elevation} blur={elevation * 2} color="rgba(0,0,0,0.2)" />
          </Paint>
        </RoundedRect>
      )}

      {/* Background */}
      <RoundedRect x={x} y={y} width={width} height={height} r={borderRadius} color={color} />

      {/* Border (nếu có) */}
      {borderWidth > 0 && (
        <RoundedRect
          x={x} y={y} width={width} height={height}
          r={borderRadius} color={borderColor}
          style="stroke" strokeWidth={borderWidth}
        />
      )}

      {/* Children — inject computed layout hoặc render nguyên bản */}
      {renderedChildren}
    </Group>
  );
});
```

### Yoga Integration Flow

```
Box nhận props
│
├── CÓ flex props? (flexDirection, gap, justifyContent, alignItems)
│   │
│   ├── YES → useYogaLayout() tạo Yoga tree → tính x,y cho từng child
│   │         → React.cloneElement inject x,y,width,height
│   │         → children render với vị trí tuyệt đối từ Yoga
│   │
│   └── NO  → render children nguyên bản (x,y thủ công)
│
└── Skia render: Group → RoundedRect (bg) → children
```

## Smart Re-render
- `React.memo`: chặn re-render khi props không thay đổi.
- Zustand selector: chỉ re-render khi layout của Box này thay đổi.
- `useDerivedValue`: Skia canvas chỉ re-render khi animated value thay đổi.

## Cách dùng

### Absolute positioning (không flex — backward compatible)
```tsx
<Box x={16} y={100} width={328} height={160} color="white" borderRadius={12} elevation={4}>
  <Text x={32} y={116} text="Hello" fontSize={18} color="black" />
  <Image x={32} y={148} width={120} height={80} src="..." />
</Box>
```

### Flex layout — Yoga tính x/y tự động
```tsx
{/* Column layout — children tự xếp dọc, gap 12px */}
<Box x={16} y={100} width={328} color="white" borderRadius={12}
  flexDirection="column" gap={12} padding={16}
>
  <Text text="Card Title" fontSize={18} fontWeight="bold" />
  <Text text="Description here" fontSize={14} color={theme.colors.textSecondary} />
  <Button text="Action" height={40} />
</Box>
{/* Yoga tính: Text1 → (16,16), Text2 → (16,48), Button → (16,74) */}
```

### Row layout — spaceBetween
```tsx
<Box x={0} y={0} width={360} height={60} color="white"
  flexDirection="row" justifyContent="spaceBetween" alignItems="center" padding={16}
>
  <Text text="MyApp" fontSize={20} fontWeight="bold" />
  <Avatar size={36} src={user.avatar} />
</Box>
```

### Event handling (có hoặc không flex đều hoạt động)
```tsx
<Box x={16} y={300} width={200} height={60}
  color={theme.colors.primaryVariant} borderRadius={8}
  hitTestBehavior="opaque"
  onPress={() => console.log('Pressed!')}
>
  <Text x={32} y={320} text="Bấm vào đây" />
</Box>
```

## User Event Logic
- Hit test xảy ra ở `CanvasRoot` → dispatch vào `eventStore` → Gesture Arena
- `onPress`: TapRecognizer win → callback
- `hitTestBehavior=deferToChild`: Box chỉ nhận event nếu một child nhận event.

## Links
- Store: [widget-store.md](../store-design/widget-store.md), [layout-store.md](../store-design/layout-store.md), [event-store.md](../store-design/event-store.md)
- Hooks: [useWidget.md](../hooks/useWidget.md), [useHitTest.md](../hooks/useHitTest.md), [useYogaLayout.md](../hooks/useYogaLayout.md)
- Integration: [integration.md](../store-design/integration.md)
- Layout: [Row.md](./Row.md), [Column.md](./Column.md), [Stack.md](./Stack.md)
- Phase: [phase4_layout_engine.md](../plans/phase4_layout_engine.md)

