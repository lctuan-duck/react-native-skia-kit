# Phase 3: Base Widget

## Nguyên tắc

> **Component = Skia sub-tree (Group + primitives), KHÔNG phải Canvas.**
> Mọi component đều render vào Canvas chung của `CanvasRoot`.

```
// ✅ Đúng: component trả về Skia Group
function Box({ x, y, width, height, color, children }) {
  return (
    <Group>
      <RoundedRect x={x} y={y} width={width} height={height} color={color} />
      {children}  {/* children cũng là Skia nodes */}
    </Group>
  );
}

// ❌ Sai: mỗi component có Canvas riêng
function Box(...) {
  return <Canvas>...</Canvas>;  // Tạo GPU surface riêng — SAI
}
```

## Pattern cho từng loại component

### Leaf node (không có children)
```tsx
// Text, Icon, Divider, ProgressBar...
function Text({ x, y, width, text, fontSize, color }) {
  const paragraph = buildParagraph(text, fontSize, color);
  return <Paragraph paragraph={paragraph} x={x} y={y} width={width} />;
}
```

### Container node (có children)
```tsx
// Box, Card, Button...
function Box({ x, y, width, height, color, children }) {
  return (
    <Group>
      <RoundedRect x={x} y={y} width={width} height={height} color={color} />
      {children}
    </Group>
  );
}
```

### Scroll node (transform offset)
```tsx
// ScrollView, ListView
function ScrollView({ x, y, width, height, scrollOffset, children }) {
  return (
    <Group clip={{ x, y, width, height }}>
      <Group transform={[{ translateY: -scrollOffset }]}>
        {children}
      </Group>
    </Group>
  );
}
```

### Overlay node (high z-index, drawn last)
```tsx
// Modal, Overlay, Tooltip
function Modal({ visible, x, y, width, height, children }) {
  if (!visible) return null;
  return (
    <Group>
      {/* Dim background */}
      <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} color="rgba(0,0,0,0.5)" />
      {/* Dialog content */}
      <Group>
        <RoundedRect x={x} y={y} width={width} height={height} r={16} color="white" />
        {children}
      </Group>
    </Group>
  );
}
```

## Checklist
- [ ] Định nghĩa `WidgetProps` interface (x, y, width, height, color, children, onPress...)
- [ ] Component Box: `<Group><RoundedRect/>{children}</Group>`
- [ ] Component Text: `<Paragraph>` với SkParagraph builder
- [ ] Component Image: `<Image>` với `useImage` hook
- [ ] Tất cả components đều nhận `x, y, width, height` từ Yoga layout result

## WidgetProps Interface
```ts
interface WidgetProps {
  // Layout (tính bởi Yoga, inject từ layoutStore)
  x?: number;
  y?: number;
  width?: number;
  height?: number;

  // Style
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;

  // Flex (dùng để truyền vào Yoga.Node, không dùng trực tiếp với Skia)
  flex?: number;
  flexDirection?: 'row' | 'column';
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: number;

  // Children (cũng là Skia nodes)
  children?: React.ReactNode;

  // Events
  onPress?: () => void;
  onLongPress?: () => void;
  onLayout?: (layout: LayoutRect) => void;

  // Accessibility
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;

  // Advanced
  hitTestBehavior?: 'opaque' | 'translucent' | 'deferToChild';
  zIndex?: number;
}
```

## Nguồn tham khảo
- [Flutter Widget](https://docs.flutter.dev/development/ui/widgets)
- [Skia Paragraph API](https://skia.org/docs/user/modules/skparagraph)
- [React Native Skia Components](https://shopify.github.io/react-native-skia/docs/components/)
