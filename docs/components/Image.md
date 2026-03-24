# Image

Hiển thị ảnh từ URL hoặc local path. Tương đương Flutter `Image.network` / `Image.asset`.

## Interface

```ts
type ImageStyle = ColorStyle & BorderStyle & FlexChildStyle & {
  width?: number;
  height?: number;
};

interface ImageProps {
  src: string;                   // URL hoặc local path — BẮT BUỘC
  fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight';
  placeholder?: React.ReactNode;
  style?: ImageStyle;            // width, height, borderRadius, opacity
  onPress?: () => void;
  onError?: (e: Error) => void;
  onLoad?: () => void;
}
```

## Cách dùng

```tsx
<Image src="https://example.com/photo.jpg" style={{ width: 200, height: 150 }} />
<Image src={url} style={{ width: 100, height: 100, borderRadius: 50 }} />
<Image src={url} fit="contain" style={{ width: 300, height: 200, opacity: 0.8 }} />
```

> **Lưu ý**: Không có flat `width`/`height`/`borderRadius` props — tất cả qua `style`.
