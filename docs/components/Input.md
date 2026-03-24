# Input

Ô nhập liệu. Tương đương Flutter `TextField`.

## Interface

```ts
type InputVariant = 'outline' | 'solid' | 'underlined';

type InputStyle = ColorStyle & BorderStyle & FlexChildStyle & {
  width?: number;
  height?: number;
};

interface InputProps {
  value?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoFocus?: boolean;
  variant?: InputVariant;        // default: 'outline'
  color?: SemanticColor;         // default: 'primary' (focus border)
  disabled?: boolean;
  style?: InputStyle;
  onChanged?: (text: string) => void;
  onSubmitted?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

## Cách dùng

```tsx
<Input value={text} onChanged={setText} placeholder="Enter name..." />
<Input variant="solid" color="info" style={{ width: 300 }} />
<Input variant="underlined" secureTextEntry placeholder="Password" />
```
