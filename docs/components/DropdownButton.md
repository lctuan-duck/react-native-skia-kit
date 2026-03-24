# DropdownButton

Menu chọn dropdown. Tương đương Flutter `DropdownButton`.

## Interface

```ts
type DropdownButtonStyle = ColorStyle & BorderStyle & FlexChildStyle & {
  width?: number;
  height?: number;
};

interface DropdownItem {
  label: string;
  value: string;
  icon?: string;
}

interface DropdownButtonProps {
  items: DropdownItem[];
  value?: string;
  placeholder?: string;
  variant?: 'outline' | 'solid' | 'underlined';
  color?: SemanticColor;         // default: 'primary'
  disabled?: boolean;
  style?: DropdownButtonStyle;
  onChanged?: (value: string) => void;
  screenWidth?: number;
  screenHeight?: number;
}
```

## Cách dùng

```tsx
<DropdownButton
  items={[
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
  ]}
  value={fruit}
  onChanged={setFruit}
  placeholder="Select fruit"
/>
```
