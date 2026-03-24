# Drawer

Panel bên trượt ra. Tương đương Flutter `Drawer`.

## Interface

```ts
type DrawerStyle = ColorStyle & ShadowStyle & FlexChildStyle & { width?: number; };

interface DrawerProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  barrierColor?: string;
  style?: DrawerStyle;           // width, backgroundColor, elevation
  screenWidth?: number;
  screenHeight?: number;
}
```

## Cách dùng

```tsx
<Drawer visible={showDrawer} onClose={() => setShowDrawer(false)}
  style={{ width: 280 }}
>
  <ListTile title="Home" leading={<Icon name="home" />} />
  <ListTile title="Settings" leading={<Icon name="cog" />} />
</Drawer>
```
