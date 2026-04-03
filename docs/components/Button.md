# Button

Nút bấm đa biến thể. Tương đương Flutter `ElevatedButton` / `OutlinedButton` / `TextButton` / `IconButton` / `FloatingActionButton`.

## Interface

```ts
type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link' | 'icon' | 'fab';

type ButtonStyle = LayoutStyle & ColorStyle & BorderStyle & ShadowStyle & SpacingStyle & FlexChildStyle & {
  textColor?: string;
  iconSize?: number;
  tapSize?: number;
};

interface ButtonProps {
  text?: string;
  icon?: string;
  variant?: ButtonVariant;       // default: 'solid'
  color?: SemanticColor;         // default: 'primary'
  disabled?: boolean;
  extended?: boolean;            // FAB: icon + label
  interactive?: 'ripple' | 'bounce' | 'opacity' | 'none'; // Default: 'ripple'
  rippleColor?: string;
  onPress?: (localX?: number, localY?: number) => void;
  onLongPress?: () => void;
  style?: ButtonStyle;
}
```

## Variant Table

| Variant | Background | Border | Elevation | Text |
|---------|-----------|--------|-----------|------|
| `solid` | semantic color | none | 2 | contrast (onColor) |
| `outline` | transparent | semantic color | 0 | semantic color |
| `ghost` | color/15% | none | 0 | semantic color |
| `link` | transparent | none | 0 | semantic color |
| `icon` | transparent | none | 0 | semantic color |
| `fab` | semantic color | none | 6 | contrast |

## Cách dùng

```tsx
// Solid button (mặc định)
<Button text="Submit" onPress={handleSubmit} />

// Outline button
<Button text="Cancel" variant="outline" color="neutral" />

// Ghost
<Button text="Learn more" variant="ghost" color="info" />

// Icon button
<Button icon="heart" variant="icon" color="error" />

// FAB
<Button icon="plus" variant="fab" color="primary" />
<Button icon="edit" text="Edit" variant="fab" extended />

// Custom style override
<Button
  text="Custom"
  variant="solid"
  color="success"
  style={{ borderRadius: 24, height: 48 }}
/>
```
