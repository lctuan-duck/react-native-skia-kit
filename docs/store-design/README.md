# Store Design for Widget, Layout, Navigation

## Mục đích
- Thiết kế store quản lý widget, layout, navigation, event cho UI kit Skia.
- Đảm bảo đồng bộ, tường minh giữa các component, giống Flutter.
- Hỗ trợ thao tác, event, lifecycle, state restore, keep-alive.

## Yêu cầu
- Quản lý widget tree, layoutMap, hitMap, navigationStack, screenMap, stateMap.
- Hỗ trợ nhiều canvas/nav (main, modal, tab).
- Dễ cleanup, restore, đồng bộ state giữa các component.
- Hỗ trợ event: onPress, onChange, onScroll, onFocus, onBlur, animation, gesture.
- Hỗ trợ HitTestBehavior (opaque, translucent, deferToChild) cho event handling.
- Hỗ trợ Gesture Arena để xử lý xung đột gesture.

## Cấu trúc folder

### Core Stores
| File | Mục đích | Data Structure |
|------|----------|----------------|
| [widget-store.md](./widget-store.md) | Widget tree, id, state, lifecycle | `Map` |
| [layout-store.md](./layout-store.md) | LayoutMap, constraints, Yoga, dirty checking | `Map + Set` |
| [nav-store.md](./nav-store.md) | Navigation stack, screenMap, Router 2.0 | `Map` |
| [event-store.md](./event-store.md) | HitMap, HitTestBehavior, Gesture Arena | `Map<Map>` |
| [overlay-store.md](./overlay-store.md) | Portal/Overlay (Modal, Tooltip, Toast) | `Map` |

### Feature Stores
| File | Mục đích | Data Structure |
|------|----------|----------------|
| [theme-store.md](./theme-store.md) | Theme (light/dark), global animation | `Map` |
| [hero-store.md](./hero-store.md) | Hero animation / shared element transition | `Map` |
| [accessibility-store.md](./accessibility-store.md) | Focus, role, label, screen reader | `Map` |

### Guides
| File | Mục đích |
|------|----------|
| [integration.md](./integration.md) | Cách tích hợp store vào component base |
| [special-cases.md](./special-cases.md) | Deep linking, scroll physics |

## Định hướng
- Dùng **Zustand + Immer + Map** để quản lý toàn bộ state.
- Immer giúp tránh copy toàn bộ Map mỗi lần update, chỉ tạo structural sharing.
- Mỗi widget tự tạo id, đăng ký vào store.
- Mỗi nav/canvas có store riêng hoặc object riêng trong store chung.
- Đảm bảo component có thể xử lý event, thao tác, lifecycle như Flutter.

## Cài đặt Immer cho Zustand
```ts
import { enableMapSet } from 'immer';
enableMapSet(); // Bật hỗ trợ Map/Set cho Immer

// Sau đó dùng immer middleware trong mỗi store
import { immer } from 'zustand/middleware/immer';
```

## Chuẩn Store Design (mỗi store PHẢI theo format này)

```markdown
# [StoreName] Store Design

## Mục đích
## Flutter tương đương
## TypeScript Interface
## Store Implementation (Zustand + Immer + Map)
## Actions API Table
## Selector Examples
## Links
```

## Smart Re-render (Dirty Checking)
Skia Kit dùng hệ thống 4 tầng tương đương `markNeedsPaint`/`markNeedsLayout` của Flutter:
1. **Zustand Selector**: Chỉ re-render component khi giá trị cụ thể thay đổi
2. **React.memo**: Chỉ re-render khi props thật sự thay đổi (shallow compare)
3. **useDerivedValue**: Chỉ re-render Skia canvas khi animated value thay đổi
4. **Dirty flag**: Chỉ recalculate layout cho widget bị đánh dấu dirty

## React Fiber = Flutter Element Layer
React Fiber đã đóng vai trò Element layer của Flutter:
- **React Component** = Flutter Widget (pure config, immutable)
- **React Fiber** = Flutter Element (lifecycle, reconciliation, diff tree)
- **Skia draw calls** = Flutter RenderObject (vẽ UI)

Không cần tạo thêm Element layer vì React Fiber đã xử lý reconciliation, diff, và lifecycle.
