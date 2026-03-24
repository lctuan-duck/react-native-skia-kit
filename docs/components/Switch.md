# Switch

Toggle on/off với thumb animation. Tương đương Flutter `Switch`.

## Interface

```ts
type SwitchStyle = ColorStyle & FlexChildStyle & {
  trackColor?: string;
  thumbColor?: string;
  width?: number;
  height?: number;
};

interface SwitchProps {
  value?: boolean;
  disabled?: boolean;
  color?: SemanticColor;         // default: 'primary'
  style?: SwitchStyle;
  onChange?: (value: boolean) => void;
  onPress?: () => void;
}
```

## Cách dùng

```tsx
<Switch value={enabled} onChange={setEnabled} />
<Switch value color="success" />
<Switch disabled />
<Switch value style={{ trackColor: '#ccc', thumbColor: '#fff' }} />
```
