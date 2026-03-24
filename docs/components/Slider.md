# Slider

Thanh trượt chọn giá trị liên tục. Tương đương Flutter `Slider`.

## Interface

```ts
type SliderStyle = ColorStyle & FlexChildStyle & {
  trackColor?: string;
  thumbColor?: string;
  width?: number;
};

interface SliderProps {
  min?: number;                  // default: 0
  max?: number;                  // default: 100
  value?: number;
  disabled?: boolean;
  color?: SemanticColor;         // default: 'primary'
  style?: SliderStyle;
  onChange?: (value: number) => void;
}
```

## Cách dùng

```tsx
<Slider value={volume} onChange={setVolume} max={100} />
<Slider value={50} color="success" style={{ width: 200 }} />
<Slider disabled value={30} />
```
