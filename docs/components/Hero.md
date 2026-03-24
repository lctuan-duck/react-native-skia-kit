# Hero

Shared element transition. Tương đương Flutter `Hero`.

## Interface

```ts
interface HeroProps {
  tag: string;                   // unique identifier to match across screens
  width?: number;
  height?: number;
  children: React.ReactNode;
}

interface HeroOverlayProps {
  duration?: number;             // default: 300ms
}
```

## Cách dùng

```tsx
// Screen A
<Hero tag="product-image" width={80} height={80}>
  <Image src={url} style={{ width: 80, height: 80 }} />
</Hero>

// Screen B
<Hero tag="product-image" width={360} height={300}>
  <Image src={url} style={{ width: 360, height: 300 }} />
</Hero>

// Trong CanvasRoot, thêm:
<HeroOverlay />
```
