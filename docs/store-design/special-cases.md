# Special Cases Store Design

## Mục đích
- Tổng hợp các store đặc biệt cho scroll physics và deep linking.
- Các store khác đã tách thành file riêng, xem danh sách bên dưới.

> **Lưu ý**: Các store sau đã được tách ra file riêng:
> - Theme → [theme-store.md](./theme-store.md)
> - Hero Animation → [hero-store.md](./hero-store.md)
> - Accessibility → [accessibility-store.md](./accessibility-store.md)
> - Portal/Overlay → [overlay-store.md](./overlay-store.md) (đã merge)

---

## 1. Deep Linking Store

Quản lý deep linking và tích hợp với Navigator 2.0.

> Chi tiết Router/Deep linking: [nav-store.md](./nav-store.md)

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
enableMapSet();

interface DeepLinkStore {
  linkMap: Map<string, string>;       // key: linkId, value: URL
  paramsMap: Map<string, Record<string, string>>; // key: linkId, value: params

  setLink: (linkId: string, url: string, params?: Record<string, string>) => void;
  removeLink: (linkId: string) => void;
  getLink: (linkId: string) => string | undefined;
  getParams: (linkId: string) => Record<string, string> | undefined;
}

export const useDeepLinkStore = create<DeepLinkStore>()(immer((set, get) => ({
  linkMap: new Map(),
  paramsMap: new Map(),

  setLink: (linkId, url, params) => set((state) => {
    state.linkMap.set(linkId, url);
    if (params) state.paramsMap.set(linkId, params);
  }),

  removeLink: (linkId) => set((state) => {
    state.linkMap.delete(linkId);
    state.paramsMap.delete(linkId);
  }),

  getLink: (linkId) => get().linkMap.get(linkId),
  getParams: (linkId) => get().paramsMap.get(linkId),
})));
```

Khi nhận deep link → RouteParser parse URL → RouterDelegate chuyển màn hình.

---

## 2. Scroll Physics

Quản lý scroll physics cho ScrollView/ListView.

> Hook sử dụng: [useScrollPhysics.md](../hooks/useScrollPhysics.md)

```ts
interface ScrollPosition {
  pixels: number;
  minScrollExtent: number;
  maxScrollExtent: number;
  velocity: number;
}

interface ScrollPhysics {
  applyPhysicsToUserOffset(offset: number, position: ScrollPosition): number;
  applyBoundaryConditions(value: number, position: ScrollPosition): number;
  createBallisticSimulation(position: ScrollPosition): ScrollSimulation | null;
}

// ClampingScrollPhysics (Android style)
class ClampingScrollPhysics implements ScrollPhysics {
  applyPhysicsToUserOffset(offset, pos) { return offset; }

  applyBoundaryConditions(value, pos) {
    if (value < pos.minScrollExtent) return value - pos.minScrollExtent;
    if (value > pos.maxScrollExtent) return value - pos.maxScrollExtent;
    return 0;
  }

  createBallisticSimulation(pos) {
    if (pos.velocity === 0) return null;
    return new FrictionSimulation(pos.pixels, pos.velocity, 0.015, pos.minScrollExtent, pos.maxScrollExtent);
  }
}

// BouncingScrollPhysics (iOS style)
class BouncingScrollPhysics implements ScrollPhysics {
  applyPhysicsToUserOffset(offset, pos) {
    if (pos.pixels < pos.minScrollExtent || pos.pixels > pos.maxScrollExtent) {
      const overscroll = pos.pixels < pos.minScrollExtent
        ? pos.minScrollExtent - pos.pixels
        : pos.pixels - pos.maxScrollExtent;
      return offset * (1 / (1 + overscroll / 100));
    }
    return offset;
  }

  applyBoundaryConditions(value, pos) { return 0; /* cho phép overscroll */ }

  createBallisticSimulation(pos) {
    if (pos.pixels < pos.minScrollExtent) {
      return new SpringSimulation(pos.pixels, pos.minScrollExtent, pos.velocity);
    }
    if (pos.pixels > pos.maxScrollExtent) {
      return new SpringSimulation(pos.pixels, pos.maxScrollExtent, pos.velocity);
    }
    if (pos.velocity !== 0) {
      return new FrictionSimulation(pos.pixels, pos.velocity, 0.015);
    }
    return null;
  }
}
```

---

## Links
- Theme: [theme-store.md](./theme-store.md)
- Hero: [hero-store.md](./hero-store.md)
- Accessibility: [accessibility-store.md](./accessibility-store.md)
- Overlay/Portal: [overlay-store.md](./overlay-store.md)
- Navigation: [nav-store.md](./nav-store.md)
- Scroll Hook: [useScrollPhysics.md](../hooks/useScrollPhysics.md)
