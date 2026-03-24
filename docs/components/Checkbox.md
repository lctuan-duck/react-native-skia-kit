# Checkbox

Toggle boolean với checkmark. Tương đương Flutter `Checkbox`.

## Interface

```ts
type CheckboxStyle = ColorStyle & BorderStyle & FlexChildStyle;

interface CheckboxProps {
  size?: number;                 // default: 24
  checked?: boolean;
  disabled?: boolean;
  color?: SemanticColor;         // default: 'primary'
  style?: CheckboxStyle;
  onChange?: (checked: boolean) => void;
  onPress?: () => void;
}
```

## Cách dùng

```tsx
<Checkbox checked={value} onChange={setValue} />
<Checkbox checked color="success" />
<Checkbox disabled />
<Checkbox color="error" style={{ borderRadius: 8 }} />
```
