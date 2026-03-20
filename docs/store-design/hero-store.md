# Hero Animation Store Design

## Mục đích
- Quản lý shared element transition khi chuyển màn hình.
- Lưu trữ vị trí, kích thước, snapshot của widget Hero trước và sau transition.

## Flutter tương đương
- `Hero`, `HeroController`

## TypeScript Interface

```ts
interface HeroData {
  tag: string;
  rect: { x: number; y: number; width: number; height: number };
  widgetSnapshot: any; // SkImage — chụp ảnh widget để animate
}

interface HeroStore {
  heroMap: Map<string, HeroData>; // key: heroTag, value: HeroData
  isTransitioning: boolean;

  registerHero: (tag: string, heroData: HeroData) => void;
  unregisterHero: (tag: string) => void;
  startTransition: () => void;
  endTransition: () => void;
}
```

## Store Implementation

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
enableMapSet();

export const useHeroStore = create<HeroStore>()(immer((set) => ({
  heroMap: new Map(),
  isTransitioning: false,

  registerHero: (tag, heroData) => set((state) => {
    state.heroMap.set(tag, heroData);
  }),

  unregisterHero: (tag) => set((state) => {
    state.heroMap.delete(tag);
  }),

  startTransition: () => set((state) => {
    state.isTransitioning = true;
  }),

  endTransition: () => set((state) => {
    state.isTransitioning = false;
  }),
})));
```

## Actions API

| Action | Params | Mô tả |
|--------|--------|-------|
| `registerHero` | `(tag, heroData)` | Đăng ký Hero widget |
| `unregisterHero` | `(tag)` | Hủy đăng ký |
| `startTransition` | `()` | Bắt đầu hero animation |
| `endTransition` | `()` | Kết thúc hero animation |

## Cách Hero Animation hoạt động

```
Screen A: <Hero tag="avatar"> tại (50, 100, 80, 80)
    ↓ navigate sang Screen B
Screen B: <Hero tag="avatar"> tại (0, 0, 360, 200)

1. heroStore lưu rect/snapshot của cả hai screen
2. startTransition()
3. Tạo overlay animation: lerp(rectA, rectB, t) trong quá trình transition
4. Vẽ widget snapshot trên overlay, animate position + size
5. endTransition() khi hoàn thành
```

## Selector Examples

```ts
// Kiểm tra có đang transition không
const isTransitioning = useHeroStore((s) => s.isTransitioning);

// Lấy hero data theo tag
const heroData = useHeroStore((s) => s.heroMap.get('product-1'));
```

## Links
- Component: [Nav.md](../components/Nav.md)
- Store: [nav-store.md](./nav-store.md), [overlay-store.md](./overlay-store.md)
- Phase: [phase9_navigation.md](../plans/phase9_navigation.md)
