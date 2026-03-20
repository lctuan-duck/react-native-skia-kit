# Hero Component

## Mục đích
- Tạo shared element transition khi chuyển màn hình.
- Wrap một widget, đánh dấu bằng `tag` — khi navigate, widget sẽ animate từ vị trí cũ đến vị trí mới.

## Flutter tương đương
- `Hero`, `HeroController`

## TypeScript Interface

```ts
interface HeroProps {
  tag: string;               // REQUIRED — unique identifier cho shared element
  children: React.ReactNode; // REQUIRED — widget bên trong sẽ animate
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `tag` | `string` | — | ✅ | Tag duy nhất, match giữa 2 screens |
| `children` | `ReactNode` | — | ✅ | Widget sẽ animate |

## Kiến trúc: React Wrapper + HeroStore

> **Hero KHÔNG vẽ Skia nguyên thủy.**
> Hero = wrapper nhẹ, đăng ký vị trí vào `heroStore`, chụp snapshot.
> Khi chuyển màn hình, `Nav` component render `<HeroOverlay>` để animate.

```
Screen A: <Hero tag="avatar"> → heroStore.register("avatar", rectA)
    ↓ navigate
Screen B: <Hero tag="avatar"> → heroStore.register("avatar", rectB)
    ↓
Nav render <HeroOverlay>: animate lerp(rectA → rectB, t)
```

## Core Implementation

```tsx
import React, { useEffect, useRef } from 'react';
import { Group } from '@shopify/react-native-skia';
import { useWidget } from '../hooks/useWidget';
import { useHeroStore } from '../store/heroStore';

export const Hero = React.memo(function Hero({
  tag,
  children,
}: HeroProps) {
  const widgetId = useWidget({
    type: 'Hero',
    layout: { x: 0, y: 0, width: 0, height: 0 }, // Lấy từ child
  });

  // Đăng ký hero vào store khi mount
  useEffect(() => {
    // Layout sẽ được cập nhật khi child render xong
    const layout = useLayoutStore.getState().layoutMap.get(widgetId);
    if (layout) {
      useHeroStore.getState().registerHero(tag, {
        tag,
        rect: { x: layout.x, y: layout.y, width: layout.width, height: layout.height },
        widgetSnapshot: null, // Snapshot sẽ được chụp khi transition
      });
    }

    return () => {
      useHeroStore.getState().unregisterHero(tag);
    };
  }, [tag, widgetId]);

  return <Group>{children}</Group>;
});
```

## Cách dùng

### Cơ bản — Avatar transition
```tsx
// Screen A: Thumbnail
function ListScreen() {
  const nav = useNav();
  return (
    <Group>
      <Hero tag="product-1">
        <Image x={16} y={100} width={80} height={80} src={thumbnail} />
      </Hero>
      <Button text="View" onPress={() => nav.push('Detail')} />
    </Group>
  );
}

// Screen B: Full image — cùng tag
function DetailScreen() {
  return (
    <Group>
      <Hero tag="product-1">
        <Image x={0} y={0} width={360} height={200} src={fullImage} />
      </Hero>
    </Group>
  );
}

// Khi navigate: Image animate từ (16,100,80,80) → (0,0,360,200)
```

### Multiple heroes
```tsx
<Hero tag={`product-${item.id}`}>
  <Image x={itemX} y={itemY} width={120} height={120} src={item.image} />
</Hero>
<Hero tag={`title-${item.id}`}>
  <Text x={itemX} y={itemY + 130} text={item.name} fontSize={16} />
</Hero>
```

## Links
- Store: [hero-store.md](../store-design/hero-store.md)
- Navigation: [Nav.md](./Nav.md), [useNav.md](../hooks/useNav.md)
- Phase: [phase9_navigation.md](../plans/phase9_navigation.md)
