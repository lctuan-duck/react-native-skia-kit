# ScrollView Component

## Mục đích
- Container cuộn nội dung theo chiều dọc/ngang.
- Hỗ trợ: static children, builder pattern (virtualized), scroll physics.

## Flutter tương đương
- `SingleChildScrollView`, `ListView.builder`, `CustomScrollView`, `SliverList`

## TypeScript Interface

```ts
interface ScrollViewProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;            // default: 360
  height?: number;           // default: 600
  horizontal?: boolean;      // default: false
  physics?: 'clamped' | 'bouncing';  // default: 'clamped'
  scrollEnabled?: boolean;   // default: true
  onScroll?: (offset: number) => void;
  onEndReached?: () => void;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

// Builder pattern — virtualized (thay thế ListView)
interface ScrollViewBuilderProps<T> extends Omit<ScrollViewProps, 'children'> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  keyExtractor: (item: T) => string;
  itemHeight?: number;       // default: 64
}
```

## Kiến trúc: Skia Group + Clip + Transform

> **ScrollView KHÔNG có Canvas riêng.** Dùng `Group` với `clip` (viewport) và `transform` (scroll offset).

```
CanvasRoot (<Canvas>)
└── ScrollView
    └── <Group clip={viewport}>           ← cắt vùng nhìn thấy
        └── <Group transform={translateY}> ← offset theo scroll
            └── children / visible items
```

## Scroll Physics
- `clamped` (Android): dừng tại giới hạn, friction deceleration
- `bouncing` (iOS): rubber band + spring bounce back

## Core Implementation

### Static children (SingleChildScrollView)

```tsx
import { Group, Rect } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import { useScrollPhysics } from '../hooks/useScrollPhysics';

export function ScrollView({
  x = 0, y = 0,
  width = 360, height = 600,
  horizontal = false,
  physics = 'clamped',
  children,
}: ScrollViewProps) {
  const { scrollOffset, handlePan } = useScrollPhysics(physics, {
    viewportSize: horizontal ? width : height,
    contentSize: undefined,
  });

  const transform = horizontal
    ? [{ translateX: -scrollOffset.value }]
    : [{ translateY: -scrollOffset.value }];

  return (
    <Group clip={{ x, y, width, height }}>
      <Group transform={transform}>
        {children}
      </Group>
      {/* Scroll indicator */}
      {!horizontal && (
        <Rect x={x + width - 3} y={y} width={3}
          height={height * height / (contentHeight || height)}
          color="rgba(0,0,0,0.25)" />
      )}
    </Group>
  );
}
```

### Builder pattern (ListView virtualized)

```tsx
const BUFFER = 5;

export function ScrollViewBuilder<T>({
  x = 0, y = 0,
  width = 360, height = 600,
  data, renderItem, keyExtractor,
  itemHeight = 64,
  physics = 'clamped',
}: ScrollViewBuilderProps<T>) {
  const { scrollOffset } = useScrollPhysics(physics, {
    viewportSize: height,
    contentSize: data.length * itemHeight,
  });

  // Chỉ render items trong viewport + buffer
  const visibleRange = useDerivedValue(() => {
    const start = Math.max(0, Math.floor(scrollOffset.value / itemHeight) - BUFFER);
    const end = Math.min(data.length - 1,
      Math.ceil((scrollOffset.value + height) / itemHeight) + BUFFER);
    return { start, end };
  });

  return (
    <Group clip={{ x, y, width, height }}>
      <Group transform={[{ translateY: -scrollOffset.value }]}>
        {data.map((item, idx) => {
          if (idx < visibleRange.value.start || idx > visibleRange.value.end) return null;
          return (
            <Group key={keyExtractor(item)} transform={[{ translateY: idx * itemHeight }]}>
              {renderItem({ item, index: idx })}
            </Group>
          );
        })}
      </Group>
    </Group>
  );
}
```

### Virtualization diagram

```
  ┌─────────────────┐
  │   Buffer (5)    │ ← render trước
  ├─────────────────┤
  │   Viewport      │ ← phần user nhìn thấy
  ├─────────────────┤
  │   Buffer (5)    │ ← render trước
  └─────────────────┘
  Items ngoài buffer → null (không render)
```

## Cách dùng

### Static content — form, article
```tsx
<ScrollView x={0} y={56} width={360} height={700} physics="bouncing">
  <Column width={360} padding={16} gap={12}>
    <Text text="Article Title" fontSize={24} fontWeight="bold" />
    <Text text={longContent} fontSize={14} />
    <Image src={photo} width={328} height={200} borderRadius={12} />
  </Column>
</ScrollView>
```

### Builder — product list (virtualized)
```tsx
<ScrollViewBuilder
  x={0} y={56} width={360} height={700}
  data={products}
  keyExtractor={(p) => p.id}
  itemHeight={80}
  physics="bouncing"
  renderItem={({ item }) => (
    <Card width={328} height={72} borderRadius={12}>
      <Row padding={12} gap={12} crossAxisAlignment="center">
        <Image src={item.image} width={48} height={48} borderRadius={8} />
        <Expanded>
          <Column gap={4}>
            <Text text={item.title} fontSize={14} fontWeight="bold" />
            <Text text={item.price} fontSize={13} color={theme.colors.success} />
          </Column>
        </Expanded>
      </Row>
    </Card>
  )}
/>
```

### Horizontal scroll — stories
```tsx
<ScrollView x={0} y={100} width={360} height={80} horizontal>
  <Row gap={12} padding={[0, 16, 0, 16]}>
    {stories.map((s) => (
      <Avatar key={s.id} size={56} src={s.avatar} />
    ))}
  </Row>
</ScrollView>
```

## Gesture Arena
- Đăng ký **VerticalDragRecognizer** (hoặc Horizontal).
- Button bên trong: tap nhanh → Button thắng; kéo dọc → ScrollView thắng.

## Links
- Hook: [useScrollPhysics.md](../hooks/useScrollPhysics.md)
- Related: [GridView.md](./GridView.md), [PageView.md](./PageView.md)
- Store: [event-store.md](../store-design/event-store.md)
- Physics: [special-cases.md](../store-design/special-cases.md)
