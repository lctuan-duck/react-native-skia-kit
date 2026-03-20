# useYogaLayout Hook

## Mục đích
- Hook cốt lõi biến **Yoga flex props** (flexDirection, gap, padding, alignItems, justifyContent, flex...)
  thành **computed `{ x, y, width, height }` tuyệt đối** cho từng child.
- Được gọi bên trong Box khi Box nhận flex props.
- Thay thế toàn bộ logic layout thủ công (`x, y` cố định) bằng Yoga engine.

> Đây là **cầu nối** giữa JSX khai báo (`<Row gap={12}>`) và Skia render (`<RoundedRect x={32} y={16} ...>`).

## Flutter tương đương
- `RenderFlex.performLayout()` → tính toán vị trí từng child trong Row/Column
- `RenderStack.performLayout()` → tính toán vị trí cho Stack/Positioned

## TypeScript Interface

```ts
interface YogaFlexProps {
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap';     // cho GridView, Wrap
  justifyContent?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
  rowGap?: number;                  // gap dọc khi flexWrap
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | 'auto';
  padding?: number | [number, number, number, number]; // [top, right, bottom, left]
  margin?: number | [number, number, number, number];
  position?: 'relative' | 'absolute';  // Stack/Positioned → absolute
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

interface ComputedLayout {
  x: number;     // computed absolute left
  y: number;     // computed absolute top
  width: number; // computed width
  height: number;// computed height
}

// Hook signature
function useYogaLayout(
  widgetId: string,
  containerLayout: { x: number; y: number; width: number; height: number },
  flexProps: YogaFlexProps,
  children: React.ReactNode
): ComputedLayout[];
```

## Core Implementation

```ts
import { useRef, useMemo, useEffect } from 'react';
// Option A: Dùng Yoga built-in từ RN (qua JSI — không cần install)
import { Yoga } from 'react-native-yoga-jsi';
// Option B: Standalone (nếu cần chạy ngoài RN)
// import Yoga from 'yoga-layout';
import { useLayoutStore } from '../store/layoutStore';

// ===== Mapping helpers =====

const JUSTIFY_MAP: Record<string, number> = {
  start:        Yoga.JUSTIFY_FLEX_START,
  center:       Yoga.JUSTIFY_CENTER,
  end:          Yoga.JUSTIFY_FLEX_END,
  spaceBetween: Yoga.JUSTIFY_SPACE_BETWEEN,
  spaceAround:  Yoga.JUSTIFY_SPACE_AROUND,
  spaceEvenly:  Yoga.JUSTIFY_SPACE_EVENLY,
};

const ALIGN_MAP: Record<string, number> = {
  start:   Yoga.ALIGN_FLEX_START,
  center:  Yoga.ALIGN_CENTER,
  end:     Yoga.ALIGN_FLEX_END,
  stretch: Yoga.ALIGN_STRETCH,
  auto:    Yoga.ALIGN_AUTO,
};

// ===== Hook =====

export function useYogaLayout(
  widgetId: string,
  container: { x: number; y: number; width: number; height: number },
  flexProps: YogaFlexProps,
  childrenElements: React.ReactNode,
): ComputedLayout[] {
  const rootNodeRef = useRef<YogaNode | null>(null);

  const computedLayouts = useMemo(() => {
    // 1. Tạo root Yoga Node (= container Box)
    const root = YogaNode.create();
    root.setWidth(container.width);
    root.setHeight(container.height);

    // 2. Apply flex props cho root
    if (flexProps.flexDirection === 'row') {
      root.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
    } else {
      root.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
    }

    if (flexProps.justifyContent) {
      root.setJustifyContent(JUSTIFY_MAP[flexProps.justifyContent] ?? Yoga.JUSTIFY_FLEX_START);
    }
    if (flexProps.alignItems) {
      root.setAlignItems(ALIGN_MAP[flexProps.alignItems] ?? Yoga.ALIGN_STRETCH);
    }
    if (flexProps.gap != null) {
      root.setGap(Yoga.GUTTER_ALL, flexProps.gap);
    }
    if (flexProps.rowGap != null) {
      root.setGap(Yoga.GUTTER_ROW, flexProps.rowGap);
    }
    if (flexProps.flexWrap === 'wrap') {
      root.setFlexWrap(Yoga.WRAP_WRAP);
    }

    // Padding
    if (flexProps.padding != null) {
      if (typeof flexProps.padding === 'number') {
        root.setPadding(Yoga.EDGE_ALL, flexProps.padding);
      } else {
        const [pt, pr, pb, pl] = flexProps.padding;
        root.setPadding(Yoga.EDGE_TOP, pt);
        root.setPadding(Yoga.EDGE_RIGHT, pr);
        root.setPadding(Yoga.EDGE_BOTTOM, pb);
        root.setPadding(Yoga.EDGE_LEFT, pl);
      }
    }

    // 3. Tạo child Yoga Nodes
    const childNodes: YogaNode[] = [];
    const childArray = React.Children.toArray(childrenElements);

    childArray.forEach((child, index) => {
      if (!React.isValidElement(child)) return;
      const childNode = YogaNode.create();
      const childProps = child.props as any;

      // Width / Height cố định nếu child truyền
      if (childProps.width != null) childNode.setWidth(childProps.width);
      if (childProps.height != null) childNode.setHeight(childProps.height);

      // Flex properties của child (Expanded, Flexible)
      if (childProps.flex != null) childNode.setFlex(childProps.flex);
      if (childProps.flexGrow != null) childNode.setFlexGrow(childProps.flexGrow);
      if (childProps.flexShrink != null) childNode.setFlexShrink(childProps.flexShrink);
      if (childProps.alignSelf) {
        childNode.setAlignSelf(ALIGN_MAP[childProps.alignSelf] ?? Yoga.ALIGN_AUTO);
      }

      // Absolute positioning (Stack/Positioned)
      if (childProps.position === 'absolute') {
        childNode.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE);
        if (childProps.top != null) childNode.setPosition(Yoga.EDGE_TOP, childProps.top);
        if (childProps.left != null) childNode.setPosition(Yoga.EDGE_LEFT, childProps.left);
        if (childProps.right != null) childNode.setPosition(Yoga.EDGE_RIGHT, childProps.right);
        if (childProps.bottom != null) childNode.setPosition(Yoga.EDGE_BOTTOM, childProps.bottom);
      }

      // Margin
      if (childProps.margin != null) {
        if (typeof childProps.margin === 'number') {
          childNode.setMargin(Yoga.EDGE_ALL, childProps.margin);
        } else {
          const [mt, mr, mb, ml] = childProps.margin;
          childNode.setMargin(Yoga.EDGE_TOP, mt);
          childNode.setMargin(Yoga.EDGE_RIGHT, mr);
          childNode.setMargin(Yoga.EDGE_BOTTOM, mb);
          childNode.setMargin(Yoga.EDGE_LEFT, ml);
        }
      }

      root.insertChild(childNode, index);
      childNodes.push(childNode);
    });

    // 4. Calculate layout ← Yoga tính hết!
    root.calculateLayout(container.width, container.height, Yoga.DIRECTION_LTR);

    // 5. Extract computed layouts
    const results: ComputedLayout[] = childNodes.map((node) => ({
      x: container.x + node.getComputedLeft(),
      y: container.y + node.getComputedTop(),
      width: node.getComputedWidth(),
      height: node.getComputedHeight(),
    }));

    // 6. Cleanup Yoga nodes
    childNodes.forEach((node) => node.free());
    root.free();

    return results;
  }, [widgetId, container.x, container.y, container.width, container.height, flexProps, childrenElements]);

  // 7. Sync computed layouts vào layoutStore
  useEffect(() => {
    const childArray = React.Children.toArray(childrenElements);
    computedLayouts.forEach((layout, i) => {
      const child = childArray[i];
      if (React.isValidElement(child) && child.props.widgetId) {
        useLayoutStore.getState().setLayout(child.props.widgetId, layout);
      }
    });
  }, [computedLayouts]);

  return computedLayouts;
}
```

## Flow end-to-end

```
<Column width={328} gap={12} padding={16}>        ← (1) Parent khai báo flex props
  <Text text="Hello" />                            ← (2) Child 1: width auto, height auto
  <Row mainAxisAlignment="spaceBetween">            ← (3) Child 2: nested flex
    <Text text="Label" />
    <Text text="Value" />
  </Row>
  <Button text="Submit" height={48} />              ← (4) Child 3: height cố định
</Column>

Yoga tính toán:
┌────────────────────────────────────┐ ← Column (0,0,328,auto)
│  padding: 16                       │
│  ┌──────────────────────────────┐  │ ← Text "Hello": (16, 16, 296, 18)
│  │ Hello                        │  │
│  └──────────────────────────────┘  │
│  gap: 12                           │
│  ┌──────────────────────────────┐  │ ← Row: (16, 46, 296, 18)
│  │ Label                  Value │  │
│  └──────────────────────────────┘  │
│  gap: 12                           │
│  ┌──────────────────────────────┐  │ ← Button: (16, 76, 296, 48)
│  │          Submit              │  │
│  └──────────────────────────────┘  │
│  padding: 16                       │
└────────────────────────────────────┘

Tổng height computed = 16 + 18 + 12 + 18 + 12 + 48 + 16 = 140
```

## Khi nào hook được gọi

| Trường hợp | Có gọi useYogaLayout? |
|------------|--------------------:|
| `<Box x={0} y={0} width={100} height={100}>` (không flex) | ❌ |
| `<Box flexDirection="row" gap={12}>` (có flex) | ✅ |
| `<Row>` (= Box + flexDirection="row") | ✅ |
| `<Column>` (= Box + flexDirection="column") | ✅ |
| `<Stack>` | ✅ (children dùng position="absolute") |
| `<Center>` | ✅ (justifyContent + alignItems = center) |

## Dependency

### Option A: React Native built-in Yoga (khuyến nghị)
```
react-native đã bundle sẵn Yoga engine → truy cập qua JSI (C++ bridge)
Không cần install thêm dependency.
Dùng react-native-yoga-jsi hoặc gọi trực tiếp qua TurboModule.
```

### Option B: yoga-layout (standalone)
```
yoga-layout@^3.0.0
└── Package chính thức từ Meta, actively maintained
    (WASM + native, thay thế yoga-layout-prebuilt đã deprecated)
```

## Links
- Store: [layout-store.md](../store-design/layout-store.md)
- Base: [Box.md](../components/Box.md)
- Layout: [Row.md](../components/Row.md), [Column.md](../components/Column.md), [Stack.md](../components/Stack.md)
- Phase: [phase4_layout_engine.md](../plans/phase4_layout_engine.md)
