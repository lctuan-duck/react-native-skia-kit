# Radio

Chọn 1 trong nhiều option. Tương đương Flutter `Radio`.

## Interface

```ts
type RadioStyle = ColorStyle & BorderStyle & FlexChildStyle;

interface RadioProps {
  size?: number;                 // default: 24
  selected?: boolean;
  disabled?: boolean;
  color?: SemanticColor;         // default: 'primary'
  style?: RadioStyle;
  onChange?: (selected: boolean) => void;
  onPress?: () => void;
}
```

## Cách dùng

```tsx
<Radio selected={option === 'a'} onChange={() => setOption('a')} />
<Radio selected={option === 'b'} onChange={() => setOption('b')} color="success" />
```
