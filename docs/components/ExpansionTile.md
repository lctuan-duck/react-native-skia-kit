# ExpansionTile

Mục mở rộng/thu gọn. Tương đương Flutter `ExpansionTile`.

## Interface

```ts
type ExpansionTileStyle = ColorStyle & SpacingStyle & FlexChildStyle & {
  width?: number;
  titleColor?: string;
};

interface ExpansionTileProps {
  title: string;
  subtitle?: string;
  initiallyExpanded?: boolean;
  style?: ExpansionTileStyle;
  onExpansionChanged?: (expanded: boolean) => void;
  children?: React.ReactNode;
}
```

## Cách dùng

```tsx
<ExpansionTile title="Advanced settings" subtitle="Click to expand">
  <ListTile title="Option 1" />
  <ListTile title="Option 2" />
</ExpansionTile>
```
