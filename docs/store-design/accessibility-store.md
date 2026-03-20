# Accessibility Store Design

## Mục đích
- Quản lý accessibility state, focus, role, label cho toàn bộ widget.
- Hỗ trợ screen reader, keyboard navigation.

## Flutter tương đương
- `Semantics`, `FocusManager`, `FocusNode`

## TypeScript Interface

```ts
interface AccessibilityInfo {
  label?: string;
  role?: string;        // 'button' | 'checkbox' | 'switch' | 'slider' | 'text' | 'image'
  value?: string;
  hint?: string;
  isEnabled?: boolean;
}

interface AccessibilityStore {
  focusWidgetId: string | null;
  accessibilityMap: Map<string, AccessibilityInfo>; // key: widgetId

  setFocus: (widgetId: string | null) => void;
  setAccessibility: (widgetId: string, info: AccessibilityInfo) => void;
  removeAccessibility: (widgetId: string) => void;
  getAccessibility: (widgetId: string) => AccessibilityInfo | undefined;
}
```

## Store Implementation

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
enableMapSet();

export const useAccessibilityStore = create<AccessibilityStore>()(immer((set, get) => ({
  focusWidgetId: null,
  accessibilityMap: new Map(),

  setFocus: (widgetId) => set((state) => {
    state.focusWidgetId = widgetId;
  }),

  setAccessibility: (widgetId, info) => set((state) => {
    state.accessibilityMap.set(widgetId, info);
  }),

  removeAccessibility: (widgetId) => set((state) => {
    state.accessibilityMap.delete(widgetId);
  }),

  getAccessibility: (widgetId) => {
    return get().accessibilityMap.get(widgetId);
  },
})));
```

## Actions API

| Action | Params | Mô tả |
|--------|--------|-------|
| `setFocus` | `(widgetId \| null)` | Set focus widget |
| `setAccessibility` | `(widgetId, info)` | Đăng ký accessibility info |
| `removeAccessibility` | `(widgetId)` | Xóa accessibility info |
| `getAccessibility` | `(widgetId)` | Lấy accessibility info |

## Selector Examples

```ts
// Lấy focused widget
const focusId = useAccessibilityStore((s) => s.focusWidgetId);

// Lấy accessibility info cho widget
const a11y = useAccessibilityStore((s) => s.accessibilityMap.get(widgetId));
```

## Links
- Integration: [integration.md](./integration.md)
- Phase: [phase13_accessibility.md](../plans/phase13_accessibility.md)
