# Hero & HeroOverlay Component

## Mục đích
- Shared element transition giữa hai screens.
- Widget di chuyển mượt từ vị trí A → vị trí B khi navigate.

## Flutter tương đương
- `Hero` widget

## TypeScript Interface

```ts
// Hero — wrap widget cần animate
interface HeroProps extends WidgetProps {
  tag: string;                  // Tag duy nhất để match giữa 2 screens
  children: React.ReactNode;
}

// HeroOverlay — render animation layer
interface HeroOverlayProps {
  duration?: number;            // Animation duration (default: 300ms)
}
```

## Cách sử dụng

### 1. Wrap widget với cùng `tag` ở 2 screens

```tsx
// Screen A — avatar nhỏ
<Hero tag="product-image" x={16} y={100} width={48} height={48}>
  <Image src={product.image} width={48} height={48} />
</Hero>

// Screen B — avatar lớn
<Hero tag="product-image" x={0} y={0} width={360} height={300}>
  <Image src={product.image} width={360} height={300} />
</Hero>
```

### 2. Đặt HeroOverlay sau CanvasRoot

```tsx
<CanvasRoot>
  <Nav initial="list">
    <Screen name="list"><ProductList /></Screen>
    <Screen name="detail"><ProductDetail /></Screen>
  </Nav>
</CanvasRoot>
```

## Cách hoạt động

```
1. Screen A render → Hero đăng ký rect {x:16, y:100, w:48, h:48}
2. Navigate → heroStore.startTransition()
3. HeroOverlay snapshot prevHeroes positions
4. Screen B render → Hero đăng ký rect mới {x:0, y:0, w:360, h:300}
5. HeroOverlay animate: lerp(fromRect → toRect) 300ms
6. heroStore.endTransition() → Hero hiện lại bình thường
```

## Hooks/Stores sử dụng
- `heroStore` — register/unregister hero, transition state
- `useSharedValue` + `withTiming` — smooth animation
- `useDerivedValue` — interpolate x, y, width, height

## Nguồn tham khảo
- [Flutter Hero](https://api.flutter.dev/flutter/widgets/Hero-class.html)
