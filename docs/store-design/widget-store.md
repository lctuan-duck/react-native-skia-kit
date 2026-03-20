# Widget Store Design

## Mục đích
- Quản lý widget tree, id, state, lifecycle cho toàn bộ UI kit.
- Đảm bảo mỗi widget có id duy nhất, tự đăng ký vào store khi render.
- Hỗ trợ keep-alive, restore state, cleanup khi unmount.

## Flutter tương đương
- `Element` tree, `State` object, `BuildContext`

## TypeScript Interface

```ts
interface WidgetInfo {
  id: string;
  type: string;             // 'Box' | 'Text' | 'Button' | ...
  props: Record<string, any>;
  state: Record<string, any>;
  parentId: string | null;
  children: string[];        // child widget IDs
}

interface WidgetStore {
  widgetMap: Map<string, WidgetInfo>;

  registerWidget: (widgetInfo: WidgetInfo) => void;
  unregisterWidget: (widgetId: string) => void;
  updateWidgetState: (widgetId: string, newState: Record<string, any>) => void;
  getWidget: (widgetId: string) => WidgetInfo | undefined;
}
```

## Store Implementation

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
enableMapSet();

export const useWidgetStore = create<WidgetStore>()(immer((set, get) => ({
  widgetMap: new Map(),

  registerWidget: (widgetInfo) => set((state) => {
    state.widgetMap.set(widgetInfo.id, widgetInfo);
  }),

  unregisterWidget: (widgetId) => set((state) => {
    state.widgetMap.delete(widgetId);
  }),

  updateWidgetState: (widgetId, newState) => set((state) => {
    const widget = state.widgetMap.get(widgetId);
    if (widget) {
      state.widgetMap.set(widgetId, { ...widget, state: newState });
    }
  }),

  getWidget: (widgetId) => get().widgetMap.get(widgetId),
})));
```

## Actions API

| Action | Params | Mô tả |
|--------|--------|-------|
| `registerWidget` | `(widgetInfo: WidgetInfo)` | Đăng ký widget mới |
| `unregisterWidget` | `(widgetId: string)` | Hủy đăng ký (cleanup) |
| `updateWidgetState` | `(widgetId, newState)` | Cập nhật state widget |
| `getWidget` | `(widgetId)` | Lấy widget info |

## Selector Examples

```ts
// Lấy widget info
const widget = useWidgetStore((state) => state.widgetMap.get(widgetId));

// Đếm tổng widget
const count = useWidgetStore((state) => state.widgetMap.size);
```

## Ưu điểm dùng Immer
- Không cần `new Map(state.widgetMap)` mỗi lần update → tiết kiệm bộ nhớ.
- Immer tạo structural sharing tự động, chỉ copy phần thay đổi.
- Code dễ đọc hơn (mutate style thay vì immutable style).

## Links
- Hook: [useWidgetId.md](../hooks/useWidgetId.md)
- Layout: [layout-store.md](./layout-store.md)
- Event: [event-store.md](./event-store.md)
- Integration: [integration.md](./integration.md)
