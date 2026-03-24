# PopupMenuButton

Menu popup khi press. Tương đương Flutter `PopupMenuButton`.

## Interface

```ts
type PopupMenuButtonStyle = ColorStyle & BorderStyle & ShadowStyle & FlexChildStyle & {
  width?: number;
};

interface PopupMenuItem {
  label: string;
  value: string;
  icon?: string;
  isDestructive?: boolean;
}

interface PopupMenuButtonProps {
  items: PopupMenuItem[];
  icon?: string;
  child?: React.ReactNode;
  style?: PopupMenuButtonStyle;
  onSelected?: (value: string) => void;
  screenWidth?: number;
  screenHeight?: number;
}
```

## Cách dùng

```tsx
<PopupMenuButton
  items={[
    { label: 'Edit', value: 'edit', icon: 'edit' },
    { label: 'Delete', value: 'delete', icon: 'trash', isDestructive: true },
  ]}
  onSelected={(value) => handleAction(value)}
/>
```
