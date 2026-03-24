# Divider

Đường kẻ phân cách. Tương đương Flutter `Divider`.

## Interface

```ts
type DividerStyle = FlexChildStyle & {
  color?: string;
  thickness?: number;
  indent?: number;
};

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  color?: SemanticColor;         // default: 'neutral'
  style?: DividerStyle;
}
```

## Cách dùng

```tsx
<Divider />
<Divider color="error" />
<Divider orientation="vertical" style={{ thickness: 2, indent: 16 }} />
```
