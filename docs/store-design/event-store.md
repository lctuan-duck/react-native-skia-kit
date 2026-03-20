# Event Store Design

## Mục đích
- Quản lý hitMap, HitTestBehavior, Gesture Arena, event bubbling cho từng canvas/nav.
- Đảm bảo xử lý event, gesture, animation đồng bộ, hỗ trợ xung đột gesture.

## HitTestBehavior
Mỗi widget khi đăng ký vào hitMap sẽ khai báo `hitTestBehavior`:
- **`opaque`**: Widget chặn event, không truyền xuống widget bên dưới (mặc định cho Button, Checkbox, Switch).
- **`translucent`**: Widget nhận event VÀ cho phép widget bên dưới cũng nhận (cho Modal overlay, Tooltip).
- **`deferToChild`**: Chỉ nhận event nếu child nào đó nhận event (mặc định cho Box, Card, Image).

## Cấu trúc HitEntry
```ts
type HitTestBehavior = 'opaque' | 'translucent' | 'deferToChild';

type HitEntry = {
  widgetId: string;
  parentId: string | null;       // Để hỗ trợ event bubbling
  rect: { left: number; top: number; width: number; height: number };
  zIndex: number;
  hitTestBehavior: HitTestBehavior;
  callbacks: {
    onPress?: () => void;
    onLongPress?: () => void;
    onPanStart?: (e: any) => void;
    onPanUpdate?: (e: any) => void;
    onPanEnd?: (e: any) => void;
  };
};
```

## Cấu trúc store
```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useEventStore = create(immer((set) => ({
  hitMaps: new Map(), // key: canvasId/navId, value: Map<widgetId, HitEntry>

  registerHit: (canvasId, widgetId, hitEntry) => set((state) => {
    if (!state.hitMaps.has(canvasId)) {
      state.hitMaps.set(canvasId, new Map());
    }
    state.hitMaps.get(canvasId).set(widgetId, hitEntry);
  }),

  unregisterHit: (canvasId, widgetId) => set((state) => {
    const hitMap = state.hitMaps.get(canvasId);
    if (hitMap) hitMap.delete(widgetId);
  }),

  clearHitMap: (canvasId) => set((state) => {
    state.hitMaps.delete(canvasId);
  })
})));
```

## Event Bubbling Logic
```ts
function handleTouch(canvasId: string, x: number, y: number) {
  const hitMap = useEventStore.getState().hitMaps.get(canvasId);
  if (!hitMap) return;

  // Bước 1: Thu thập tất cả widget tại (x, y), sắp xếp theo zIndex cao → thấp
  const hitWidgets: HitEntry[] = [];
  for (const [, entry] of hitMap) {
    const { left, top, width, height } = entry.rect;
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      hitWidgets.push(entry);
    }
  }
  hitWidgets.sort((a, b) => b.zIndex - a.zIndex);

  // Bước 2: Duyệt từ top → bottom, áp dụng HitTestBehavior
  const eventReceivers: HitEntry[] = [];
  for (const widget of hitWidgets) {
    eventReceivers.push(widget);
    if (widget.hitTestBehavior === 'opaque') {
      break; // Chặn event
    }
    // 'translucent': tiếp tục cho widget bên dưới nhận
    // 'deferToChild': tiếp tục (chỉ nhận nếu có child nhận)
  }

  // Bước 3: Chuyển event cho Gesture Arena (nếu nhiều recognizer)
  // Hoặc gọi trực tiếp callback
  for (const widget of eventReceivers) {
    widget.callbacks.onPress?.();
  }
}
```

## Gesture Arena
Xử lý xung đột gesture khi nhiều widget cùng muốn nhận event.

```ts
type GestureDisposition = 'accepted' | 'rejected';

interface GestureArenaMember {
  acceptGesture(pointerId: number): void;
  rejectGesture(pointerId: number): void;
}

class GestureArenaManager {
  private arenas: Map<number, GestureArenaMember[]> = new Map();

  add(pointerId: number, member: GestureArenaMember) {
    if (!this.arenas.has(pointerId)) {
      this.arenas.set(pointerId, []);
    }
    this.arenas.get(pointerId)!.push(member);
  }

  resolve(pointerId: number, member: GestureArenaMember, disposition: GestureDisposition) {
    const members = this.arenas.get(pointerId);
    if (!members) return;

    if (disposition === 'accepted') {
      for (const other of members) {
        if (other !== member) other.rejectGesture(pointerId);
      }
      member.acceptGesture(pointerId);
      this.arenas.delete(pointerId);
    } else {
      const filtered = members.filter(m => m !== member);
      if (filtered.length === 1) {
        filtered[0].acceptGesture(pointerId);
        this.arenas.delete(pointerId);
      } else {
        this.arenas.set(pointerId, filtered);
      }
    }
  }

  // Khi pointer up: nếu chưa ai thắng, first member thắng
  close(pointerId: number) {
    const members = this.arenas.get(pointerId);
    if (!members || members.length === 0) return;
    members[0].acceptGesture(pointerId);
    for (let i = 1; i < members.length; i++) {
      members[i].rejectGesture(pointerId);
    }
    this.arenas.delete(pointerId);
  }
}
```

## Gesture Recognizers

| Recognizer | Mô tả | Điều kiện win |
|-----------|--------|---------------|
| `TapGestureRecognizer` | Nhận tap | Pointer up nhanh, di chuyển < 18px |
| `LongPressGestureRecognizer` | Nhận long press | Giữ > 500ms tại vị trí |
| `HorizontalDragRecognizer` | Drag ngang | Di chuyển > 18px theo trục X |
| `VerticalDragRecognizer` | Drag dọc | Di chuyển > 18px theo trục Y |
| `PanGestureRecognizer` | Drag tự do | Di chuyển > 18px bất kỳ hướng |

## Quy trình xử lý event đầy đủ
```
Pointer Down → Hit test (thu thập widgets + HitTestBehavior)
            → Đăng ký recognizers vào Gesture Arena
            
Pointer Move → Gửi event cho tất cả recognizers
            → Recognizer tự quyết định accept/reject
            → Arena xác định winner

Pointer Up   → Arena close (force winner nếu chưa có)
            → Winner nhận toàn bộ event chain
```

## Định hướng
- Mỗi canvas/nav có hitMap riêng, lưu vùng hit + HitTestBehavior cho từng widget.
- Event bubbling dựa trên HitTestBehavior thay vì break ngay khi tìm thấy.
- Gesture Arena xử lý xung đột gesture (tap vs scroll, drag vs long press).
- Hỗ trợ gesture, animation, cleanup khi unmount.
- Dễ tích hợp với widget, layout, nav store.
