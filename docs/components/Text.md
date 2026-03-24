# Text

Hiển thị văn bản trên Skia canvas. Tương đương Flutter `Text`.

## Interface

```ts
type EllipsisMode = 'none' | 'tail' | 'head' | 'middle' | 'clip';

type TextComponentStyle = SkiaTextStyle & FlexChildStyle & {
  opacity?: number;
  width?: number;
  height?: number;
  numberOfLines?: number;
  ellipsis?: EllipsisMode;
};

interface TextProps {
  x?: number;
  y?: number;
  text?: string;
  children?: string;
  style?: TextComponentStyle;
  hitTestBehavior?: HitTestBehavior;
  onPress?: () => void;
  onLongPress?: () => void;
}
```

## Cách dùng

```tsx
// Cơ bản
<Text text="Hello World" style={{ fontSize: 16, color: '#333' }} />

// Bold + custom font
<Text text="Title" style={{ fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter' }} />

// Ellipsis (cắt text)
<Text
  text="Very long text that should be truncated..."
  style={{ width: 200, fontSize: 14, numberOfLines: 1, ellipsis: 'tail' }}
/>

// Nhiều dòng
<Text
  text="Multi-line text"
  style={{ width: 300, numberOfLines: 3, lineHeight: 22 }}
/>

// Text alignment
<Text text="Centered" style={{ width: 360, textAlign: 'center', fontSize: 16 }} />
```

## EllipsisMode
| Mode | Hiệu ứng |
|------|-----------|
| `'none'` | Không cắt |
| `'tail'` | `"Hello wo..."` |
| `'head'` | `"...lo world"` |
| `'middle'` | `"Hel...rld"` |
| `'clip'` | Cắt cứng, không dấu `...` |
