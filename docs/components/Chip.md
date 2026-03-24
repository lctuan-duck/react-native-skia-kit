# Chip

Tag / filter nhỏ có thể chọn. Tương đương Flutter `Chip` / `FilterChip`.

## Interface

```ts
type ChipVariant = 'solid' | 'outline' | 'ghost';

type ChipStyle = ColorStyle & BorderStyle & FlexChildStyle;

interface ChipProps {
  label: string;
  selected?: boolean;
  variant?: ChipVariant;       // default: 'solid'
  color?: SemanticColor;       // default: 'primary'
  style?: ChipStyle;
  onPress?: () => void;
}
```

> `ghost` variant: background rất nhạt (color/10%) + text màu semantic color

## Cách dùng

```tsx
<Wrap spacing={8}>
  <Chip label="React" color="info" />
  <Chip label="TypeScript" variant="outline" />
  <Chip label="Selected" selected color="success" />
  <Chip label="Ghost" variant="ghost" color="warning" />
</Wrap>
```
