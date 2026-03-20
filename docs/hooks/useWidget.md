# useWidget Hook

## Mục đích
- **Gom logic đăng ký widget** (widgetStore + layoutStore) vào 1 hook duy nhất.
- Tự động tạo ID, đăng ký widget khi mount, cleanup khi unmount.
- Giảm ~15 dòng boilerplate xuống còn 1 dòng cho mỗi component.

## Flutter tương đương
- `StatefulWidget.initState()` + `dispose()` + `RenderObject.performLayout()`

## TypeScript Interface

```ts
interface UseWidgetOptions<P = Record<string, any>> {
  type: string;            // 'Box' | 'Text' | 'Checkbox' | ...
  layout: LayoutRect;      // { x, y, width, height }
  props?: P;               // optional — strongly typed from component
}

function useWidget<P = Record<string, any>>(options: UseWidgetOptions<P>): string;
// Returns: widgetId (string UUID)
```

Ví dụ truyền type từ bên ngoài:
```ts
// Component tự define type cho props
interface CheckboxStoreProps {
  checked: boolean;
  disabled: boolean;
}

const widgetId = useWidget<CheckboxStoreProps>({
  type: 'Checkbox',
  layout: { x, y, width: size, height: size },
  props: { checked, disabled },  // ← IDE autocomplete + type check
});
```

## Internal Implementation

```ts
import { useEffect } from 'react';
import { useWidgetId } from './useWidgetId';
import { useWidgetStore } from '../store/widgetStore';
import { useLayoutStore } from '../store/layoutStore';

export function useWidget<P = Record<string, any>>({ type, layout, props }: UseWidgetOptions<P>): string {
  const widgetId = useWidgetId();

  useEffect(() => {
    // Register widget in store
    useWidgetStore.getState().registerWidget({
      id: widgetId,
      type,
      props: props ?? {},
      state: {},
      parentId: null,
      children: [],
    });

    // Register layout
    useLayoutStore.getState().setLayout(widgetId, layout);

    // Cleanup on unmount
    return () => {
      useWidgetStore.getState().unregisterWidget(widgetId);
      useLayoutStore.getState().removeLayout(widgetId);
    };
  }, [widgetId]);

  // Update layout khi position/size thay đổi
  useEffect(() => {
    useLayoutStore.getState().setLayout(widgetId, layout);
  }, [layout.x, layout.y, layout.width, layout.height]);

  return widgetId;
}
```

## Cách dùng

### Trong component đơn giản (chỉ cần đăng ký widget)
```tsx
const widgetId = useWidget({
  type: 'ProgressBar',
  layout: { x, y, width, height },
  props: { value, indeterminate },
});
```

### Kết hợp với useHitTest (component có event)
```tsx
const widgetId = useWidget({
  type: 'Checkbox',
  layout: { x, y, width: size, height: size },
  props: { checked, disabled },
});

useHitTest(widgetId, {
  rect: { left: x, top: y, width: size, height: size },
  callbacks: { onPress: handlePress },
  behavior: 'opaque',
});
```

## So sánh trước/sau

### Trước (15 dòng)
```tsx
const widgetId = useWidgetId();
useEffect(() => {
  useWidgetStore.getState().registerWidget({
    id: widgetId, type: 'Checkbox',
    props: { checked, disabled }, state: {},
    parentId: null, children: [],
  });
  useLayoutStore.getState().setLayout(widgetId, { x, y, width: size, height: size });
  return () => {
    useWidgetStore.getState().unregisterWidget(widgetId);
    useLayoutStore.getState().removeLayout(widgetId);
  };
}, [widgetId]);
```

### Sau (1 dòng)
```tsx
const widgetId = useWidget({ type: 'Checkbox', layout: { x, y, width: size, height: size } });
```

## Links
- Internal: [useWidgetId.md](./useWidgetId.md)
- Store: [widget-store.md](../store-design/widget-store.md), [layout-store.md](../store-design/layout-store.md)
- Used with: [useHitTest.md](./useHitTest.md)
- Integration: [integration.md](../store-design/integration.md)
