# Layout Store Design

## Mục đích
- Quản lý layoutMap, constraints, Yoga node cho toàn bộ widget.
- Đảm bảo layout đồng bộ, cập nhật khi style hoặc tree thay đổi.
- Hỗ trợ dirty checking: chỉ recalculate layout cho widget bị đánh dấu dirty.

## Flutter tương đương
- `RenderObject` layout system, `markNeedsLayout()`, `performLayout()`

## TypeScript Interface

```ts
interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  constraints?: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  };
}

interface LayoutStore {
  layoutMap: Map<string, LayoutRect>;
  dirtyWidgets: Set<string>;
  yogaNodeMap: Map<string, YogaNode>;  // cache Yoga nodes cho incremental re-layout

  setLayout: (widgetId: string, layout: LayoutRect) => void;
  removeLayout: (widgetId: string) => void;
  clearLayout: () => void;
  markNeedsLayout: (widgetId: string) => void;
  recalculateLayout: () => void;
  isDirty: (widgetId: string) => boolean;

  // Yoga node management
  setYogaNode: (widgetId: string, node: YogaNode) => void;
  getYogaNode: (widgetId: string) => YogaNode | undefined;
  removeYogaNode: (widgetId: string) => void;
}
```

## Store Implementation

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
enableMapSet();

export const useLayoutStore = create<LayoutStore>()(immer((set, get) => ({
  layoutMap: new Map(),
  dirtyWidgets: new Set(),

  setLayout: (widgetId, layout) => set((state) => {
    state.layoutMap.set(widgetId, layout);
  }),

  removeLayout: (widgetId) => set((state) => {
    state.layoutMap.delete(widgetId);
    state.dirtyWidgets.delete(widgetId);
  }),

  clearLayout: () => set((state) => {
    state.layoutMap = new Map();
    state.dirtyWidgets = new Set();
  }),

  markNeedsLayout: (widgetId) => set((state) => {
    state.dirtyWidgets.add(widgetId);
  }),

  recalculateLayout: (yogaEngine) => set((state) => {
    for (const widgetId of state.dirtyWidgets) {
      const newLayout = yogaEngine.calculateForWidget(widgetId);
      if (newLayout) {
        state.layoutMap.set(widgetId, newLayout);
      }
    }
    state.dirtyWidgets.clear();
  }),

  isDirty: (widgetId) => {
    return get().dirtyWidgets.has(widgetId);
  },
})));
```

## Actions API

| Action | Params | Mô tả |
|--------|--------|-------|
| `setLayout` | `(widgetId, layout)` | Set layout cho widget |
| `removeLayout` | `(widgetId)` | Xóa layout (cleanup) |
| `clearLayout` | `()` | Xóa tất cả layout |
| `markNeedsLayout` | `(widgetId)` | Đánh dấu cần recalculate |
| `recalculateLayout` | `(yogaEngine)` | Batch recalculate dirty widgets |
| `isDirty` | `(widgetId)` | Kiểm tra widget cần recalculate? |

## Dirty Checking Flow

```
Props thay đổi
  → markNeedsLayout(widgetId)
  → batch recalculateLayout()
  → update layoutMap chỉ cho dirty widgets
  → Zustand selector thông báo → chỉ re-render widget bị ảnh hưởng
```

Tương đương Flutter:
- `markNeedsLayout()` → `markNeedsLayout(widgetId)`
- `markNeedsPaint()` → React re-render qua Zustand selector
- `performLayout()` → `recalculateLayout()`

## Selector Examples

```ts
// Chỉ re-render khi layout của widget cụ thể thay đổi
const layout = useLayoutStore((state) => state.layoutMap.get(widgetId));

// Kiểm tra dirty
const isDirty = useLayoutStore((state) => state.dirtyWidgets.has(widgetId));
```

## Links
- Widget: [widget-store.md](./widget-store.md)
- Event: [event-store.md](./event-store.md)
- Integration: [integration.md](./integration.md)
- Phase: [phase4_layout_engine.md](../plans/phase4_layout_engine.md)
