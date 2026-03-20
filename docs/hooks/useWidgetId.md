# useWidgetId Hook

> **Note**: Hook này được dùng **internally** bởi [`useWidget`](./useWidget.md). Hầu hết component nên dùng `useWidget()` thay vì gọi `useWidgetId()` trực tiếp.

## Mục đích
- Tạo và lưu trữ widget ID duy nhất (UUID) cho mỗi component instance.
- Đảm bảo ID ổn định qua các lần re-render (dùng `useRef`).
- Cung cấp ID để đăng ký vào widgetStore, layoutStore, eventStore.

## Flutter tương đương
- `GlobalKey`, `ObjectKey`, Widget identity system

## API Documentation

```tsx
import { useWidgetId } from 'react-native-skia-kit/hooks';

function MyComponent() {
  const widgetId = useWidgetId();
  // widgetId: string (UUID, ổn định qua re-renders)

  // Dùng để đăng ký vào stores
  useEffect(() => {
    useWidgetStore.getState().registerWidget({ id: widgetId, ... });
    useLayoutStore.getState().setLayout(widgetId, { ... });
    useEventStore.getState().registerHit('main', widgetId, { ... });

    return () => {
      useWidgetStore.getState().unregisterWidget(widgetId);
      useLayoutStore.getState().removeLayout(widgetId);
      useEventStore.getState().unregisterHit('main', widgetId);
    };
  }, [widgetId]);
}
```

## Internal Implementation

```ts
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useWidgetId(): string {
  const idRef = useRef<string>();
  if (!idRef.current) {
    idRef.current = uuidv4();
  }
  return idRef.current;
}
```

## Chức năng
1. **Tạo UUID duy nhất** cho mỗi component instance
2. **Ổn định qua re-renders** — dùng `useRef` nên không thay đổi
3. **Dọn dẹp khi unmount** — component tự unregister qua cleanup effect

## Links
- Used by: Tất cả base components ([Box](../components/Box.md), [Text](../components/Text.md), v.v.)
- Store: [widget-store.md](../store-design/widget-store.md)
- Integration: [integration.md](../store-design/integration.md)
