# Phase 6: Gesture Manager (Hit Testing + Event Bubbling + Gesture Arena)

## Checklist
- [ ] Lưu trữ vùng bấm (Rect) + HitTestBehavior của các widget
- [ ] Bắt sự kiện chạm, xác định widget nào được nhấn dựa trên tọa độ
- [ ] Triển khai Event Bubbling dựa trên HitTestBehavior
- [ ] Triển khai Gesture Arena để xử lý xung đột gesture
- [ ] Kích hoạt callback cho widget (onPress, onLongPress, onPan)

## HitTestBehavior
Mỗi widget khai báo cách xử lý event:
- **`opaque`**: Chặn event, không truyền xuống (Button, Checkbox, Switch)
- **`translucent`**: Nhận event VÀ cho phép widget bên dưới nhận (Modal overlay)
- **`deferToChild`**: Chỉ nhận nếu child nhận (Box, Card, Image)

## Steps
1. Mỗi component base khi render sẽ đăng ký vào hitMap (eventStore) gồm:
   - rect (x, y, w, h)
   - zIndex
   - **hitTestBehavior** (opaque | translucent | deferToChild)
   - callbacks (onPress, onLongPress, onPanStart, onPanUpdate, onPanEnd)
   - parentId (cho event bubbling)

2. Khi có sự kiện Pointer Down trên Canvas:
   - Thu thập **tất cả** widget tại (pX, pY), sắp xếp theo zIndex cao → thấp
   - Áp dụng HitTestBehavior:
     - `opaque`: thêm widget vào danh sách nhận event, **dừng**
     - `translucent`: thêm widget, **tiếp tục duyệt**
     - `deferToChild`: tiếp tục, chỉ thêm nếu có child nhận
   - Đăng ký gesture recognizers của các widget nhận event vào Gesture Arena

3. Khi có Pointer Move:
   - Gửi event cho tất cả recognizers trong arena
   - Recognizer tự quyết định accept/reject dựa trên điều kiện

4. Khi có Pointer Up:
   - Arena close: force winner nếu chưa có ai thắng
   - Winner nhận toàn bộ event

## Event Bubbling Logic
```ts
function handleTouch(canvasId, x, y) {
  const hitMap = eventStore.getState().hitMaps.get(canvasId);
  if (!hitMap) return;

  // Bước 1: Thu thập tất cả widget tại (x, y)
  const hitWidgets = [];
  for (const [, entry] of hitMap) {
    const { left, top, width, height } = entry.rect;
    if (x >= left && x <= left + width && y >= top && y <= top + height) {
      hitWidgets.push(entry);
    }
  }
  hitWidgets.sort((a, b) => b.zIndex - a.zIndex);

  // Bước 2: Áp dụng HitTestBehavior
  const eventReceivers = [];
  for (const widget of hitWidgets) {
    eventReceivers.push(widget);
    if (widget.hitTestBehavior === 'opaque') break;
    // translucent: tiếp tục
    // deferToChild: tiếp tục
  }

  // Bước 3: Chuyển event cho Gesture Arena
  const arena = new GestureArenaManager();
  for (const widget of eventReceivers) {
    // Đăng ký recognizers vào arena
    if (widget.callbacks.onPress) {
      arena.add(pointerId, new TapRecognizer(widget));
    }
    if (widget.callbacks.onPanStart) {
      arena.add(pointerId, new PanRecognizer(widget));
    }
  }
}
```

## Gesture Arena
Xử lý xung đột gesture (giống Flutter).

### Ví dụ: Button trong ScrollView
```
User touch → Hit test → tìm thấy Button (TapRecognizer) + ScrollView (VerticalDragRecognizer)
  → Cả hai vào Arena

User di chuyển > 18px dọc
  → VerticalDragRecognizer accept → ScrollView nhận event
  → TapRecognizer bị reject → Button không nhận event

User tap nhanh (< 200ms, di chuyển < 18px)
  → TapRecognizer accept → Button nhận onPress
  → VerticalDragRecognizer bị reject → ScrollView không scroll
```

### Gesture Recognizers

| Recognizer | Điều kiện win | Sử dụng bởi |
|-----------|---------------|-------------|
| `TapRecognizer` | Pointer up nhanh, di chuyển < 18px | Button, Checkbox, Switch |
| `LongPressRecognizer` | Giữ > 500ms tại vị trí | Box (onLongPress) |
| `HorizontalDragRecognizer` | Di chuyển > 18px theo X | Slider, horizontal ScrollView |
| `VerticalDragRecognizer` | Di chuyển > 18px theo Y | Vertical ScrollView, ListView |
| `PanRecognizer` | Di chuyển > 18px bất kỳ hướng | Draggable widget |

### GestureArenaManager
```ts
class GestureArenaManager {
  private arenas: Map<number, GestureArenaMember[]> = new Map();

  add(pointerId: number, member: GestureArenaMember) {
    if (!this.arenas.has(pointerId)) this.arenas.set(pointerId, []);
    this.arenas.get(pointerId).push(member);
  }

  resolve(pointerId: number, member: GestureArenaMember, disposition: 'accepted' | 'rejected') {
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

  close(pointerId: number) {
    const members = this.arenas.get(pointerId);
    if (!members || members.length === 0) return;
    members[0].acceptGesture(pointerId);
    for (let i = 1; i < members.length; i++) members[i].rejectGesture(pointerId);
    this.arenas.delete(pointerId);
  }
}
```

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

## HitTestBehavior mặc định

| Component | HitTestBehavior |
|-----------|----------------|
| Box, Card, Image | `deferToChild` |
| Button, Checkbox, Switch, Radio | `opaque` |
| Overlay, Modal background | `translucent` |
| ScrollView, ListView | `deferToChild` + VerticalDragRecognizer |
| Slider | `opaque` + PanRecognizer |

## Thuật toán/Logic
- Event bubbling: thu thập tất cả widgets → duyệt theo HitTestBehavior → xử lý
- Gesture Arena: recognizer competition khi có xung đột (tap vs scroll, drag vs long press)
- Đảm bảo ưu tiên widget trên cùng (z-index), nhưng cho phép translucent bubbling
- Cleanup hitMap khi widget unmount

## Nguồn tham khảo
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [Flutter Hit Testing](https://docs.flutter.dev/development/ui/widgets/gestures)
- [Flutter Gesture Arena](https://api.flutter.dev/flutter/gestures/GestureArenaManager-class.html)
