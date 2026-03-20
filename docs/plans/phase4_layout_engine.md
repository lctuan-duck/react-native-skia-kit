# Phase 4: Layout Engine (Yoga/Flexbox)

## Mục tiêu
Tích hợp Yoga layout engine để components tự tính toán vị trí (`x, y, width, height`)
thay vì khai báo thủ công. Cho phép dùng `<Row>`, `<Column>`, `<Stack>` giống Flutter.

## Dependency

**Khuyến nghị**: Dùng Yoga engine built-in từ React Native (qua JSI) — không cần install thêm.

**Fallback** (standalone hoặc Web):
```
yoga-layout@^3.0.0
(Package chính thức từ Meta, thay thế yoga-layout-prebuilt đã deprecated)
```

## Kiến trúc: Yoga nằm ở đâu

```
┌──────────────────────────────────────────────────────┐
│                     JSX Layer                         │
│  <Column gap={12}>                                   │
│    <Text text="Hello" />                             │
│    <Row mainAxisAlignment="spaceBetween">             │
│      <Text text="A" />                               │
│      <Text text="B" />                               │
│    </Row>                                            │
│  </Column>                                           │
├──────────────────────────────────────────────────────┤
│              Box (Core Component)                     │
│  hasFlexProps? ───── YES ──── useYogaLayout()        │
│        │                        │                    │
│        NO                   Yoga Engine              │
│        │               ┌────────┴────────┐           │
│        ↓               │ 1. Tạo root node │           │
│  render children       │ 2. Tạo child nodes│          │
│  nguyên bản            │ 3. calculateLayout│          │
│  (x,y thủ công)        │ 4. getComputed*() │          │
│                        └────────┬────────┘           │
│                                 ↓                    │
│                     ComputedLayout[]                  │
│                   { x, y, width, height }            │
│                                 ↓                    │
│                 React.cloneElement(child, layout)     │
├──────────────────────────────────────────────────────┤
│                    Skia Layer                         │
│  <Group>                                             │
│    <RoundedRect x={computed.x} y={computed.y} ... /> │
│  </Group>                                            │
└──────────────────────────────────────────────────────┘
```

## Checklist

- [x] ✅ Tạo `useYogaLayout` hook (docs/hooks/useYogaLayout.md)
  - Mapping FlexProps → Yoga constants
  - Tạo root + child Yoga nodes
  - `calculateLayout()` → `getComputed*()`
  - Trả về ComputedLayout[] cho từng child

- [x] ✅ Update `Box.md` — gọi useYogaLayout khi có flex props
  - Detect hasFlexProps (flexDirection, gap, justifyContent, alignItems)
  - React.cloneElement inject x, y, width, height
  - Backward compatible (không flex → render nguyên bản)

- [x] ✅ Hỗ trợ flex props đầy đủ
  - flexDirection: row | column
  - justifyContent: start | center | end | spaceBetween | spaceAround | spaceEvenly
  - alignItems: start | center | end | stretch
  - alignSelf: auto | start | center | end | stretch
  - gap, padding, margin
  - flex, flexGrow, flexShrink
  - position: relative | absolute (cho Stack/Positioned)

- [x] ✅ Dirty checking flow
  - markNeedsLayout(widgetId) → batch recalculateLayout()
  - Chỉ tính lại Yoga node cho dirty widgets
  - Zustand selector → chỉ re-render component bị ảnh hưởng

## Components sử dụng Yoga

| Component | Yoga Usage |
|-----------|-----------|
| **Box** | Core — gọi `useYogaLayout` khi có flex props |
| **Row** | `flexDirection="row"` |
| **Column** | `flexDirection="column"` |
| **Stack** | Children dùng `position="absolute"` |
| **Center** | `justifyContent="center"` + `alignItems="center"` |
| **Expanded** | `flex={n}` + `alignSelf="stretch"` |
| **Flexible** | `flex={n}` |

## Yoga Props ↔ Flutter ↔ CSS Flexbox

| Yoga Prop | Flutter | CSS Flexbox |
|-----------|---------|-------------|
| `flexDirection` | `Axis` | `flex-direction` |
| `justifyContent` | `mainAxisAlignment` | `justify-content` |
| `alignItems` | `crossAxisAlignment` | `align-items` |
| `alignSelf` | — | `align-self` |
| `flex` | `Expanded(flex: n)` | `flex` |
| `gap` | `spacing` (SizedBox) | `gap` |
| `padding` | `EdgeInsets` | `padding` |
| `margin` | `EdgeInsets` | `margin` |
| `position: absolute` | `Positioned` in Stack | `position: absolute` |

## Data Flow

```
1. User writes:    <Column gap={12}> <Text /> <Button /> </Column>
2. Column renders: <Box flexDirection="column" gap={12}> ... </Box>
3. Box detects:    hasFlexProps = true
4. Box calls:      useYogaLayout(widgetId, container, { flexDirection: 'column', gap: 12 }, children)
5. Hook creates:   root Yoga node (column, gap=12) + 2 child nodes
6. Hook calls:     root.calculateLayout(width, height)
7. Hook returns:   [{ x: 0, y: 0, w: 328, h: 18 }, { x: 0, y: 30, w: 328, h: 48 }]
8. Box injects:    React.cloneElement(Text, { x: 0, y: 0, ... })
                   React.cloneElement(Button, { x: 0, y: 30, ... })
9. Skia renders:   Text at (0, 0), Button at (0, 30)
```

## Nguồn tham khảo
- [Yoga Layout Documentation](https://www.yogalayout.dev/docs/about-yoga)
- [Flutter Layout Constraints](https://docs.flutter.dev/ui/layout/constraints)
- [useYogaLayout Hook](../hooks/useYogaLayout.md)
- [Box Component](../components/Box.md)
- [layout-store.md](../store-design/layout-store.md)
