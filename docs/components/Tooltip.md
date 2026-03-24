# Tooltip

Popup nhỏ hiển thị text khi press. Tương đương Flutter `Tooltip`.

## Interface

```ts
type TooltipStyle = ColorStyle & FlexChildStyle & {
  textColor?: string;
  width?: number;
  height?: number;
};

interface TooltipProps {
  text: string;
  color?: SemanticColor;         // default: 'neutral'
  position?: 'top' | 'bottom' | 'left' | 'right';
  visible?: boolean;
  style?: TooltipStyle;
  children?: React.ReactNode;
}
```

## Cách dùng

```tsx
<Tooltip text="More info" position="top">
  <Icon name="info" />
</Tooltip>
```
