# Badge

Huy hiệu hiển thị số hoặc dot. Tương đương Flutter `Badge`.

## Interface

```ts
type BadgeVariant = 'standard' | 'dot';

type BadgeStyle = ColorStyle & BorderStyle & FlexChildStyle;

interface BadgeProps {
  variant?: BadgeVariant;      // default: 'standard'
  value?: number | string;
  size?: number;
  color?: SemanticColor;       // default: 'primary'
  style?: BadgeStyle;
  onPress?: () => void;
}
```

## Cách dùng

```tsx
<Badge value={5} color="error" />
<Badge value="99+" color="primary" />
<Badge variant="dot" color="success" />
<Badge value={3} color="warning" style={{ borderRadius: 4 }} />
```
