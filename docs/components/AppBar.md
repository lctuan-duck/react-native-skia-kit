# AppBar

Thanh app bar phía trên. Tương đương Flutter `AppBar`.

## Interface

```ts
type AppBarStyle = ColorStyle & ShadowStyle & FlexChildStyle & {
  foregroundColor?: string;
  width?: number;
  height?: number;
};

interface AppBarProps {
  title?: string;
  titleWidget?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode[];
  centerTitle?: boolean;
  style?: AppBarStyle;
  onBack?: () => void;
}
```

## Cách dùng

```tsx
<AppBar title="Dashboard" />
<AppBar title="Profile" leading={<Icon name="arrow-left" />} onBack={goBack} />
<AppBar title="Home" actions={[<Icon name="bell" />, <Icon name="cog" />]} />
<AppBar title="Custom" style={{ backgroundColor: '#1A73E8', foregroundColor: '#fff' }} />
```
