# measureText

Đo kích thước text trước khi render, sử dụng Skia Paragraph API.

## Interface

```ts
interface MeasureTextOptions extends Pick<SkiaTextStyle, 'fontSize' | 'fontWeight' | 'fontFamily'> {
  maxWidth?: number;
}

interface MeasureTextResult {
  width: number;
  height: number;
}

function measureText(text: string, options?: MeasureTextOptions): MeasureTextResult;
```

> **Lưu ý**: `fontWeight` hỗ trợ full range: `'normal'`, `'bold'`, `'100'`–`'900'` — đồng bộ với `SkiaTextStyle`.

## Cách dùng

```ts
const { width, height } = measureText('Hello World', {
  fontSize: 16,
  fontWeight: 'bold',
  fontFamily: 'Inter',
  maxWidth: 300,
});
```
