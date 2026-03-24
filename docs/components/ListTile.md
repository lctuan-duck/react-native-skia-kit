# ListTile

Hàng danh sách với title/subtitle/leading/trailing. Tương đương Flutter `ListTile`.

## Interface

```ts
type ListTileStyle = ColorStyle & SpacingStyle & FlexChildStyle & {
  titleColor?: string;
  subtitleColor?: string;
  width?: number;
  height?: number;
};

interface ListTileProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  dense?: boolean;
  style?: ListTileStyle;
  onPress?: () => void;
  onLongPress?: () => void;
}
```

## Cách dùng

```tsx
<ListTile title="Settings" subtitle="App configuration" leading={<Icon name="cog" />} />
<ListTile title="Dark mode" trailing={<Switch value={dark} onChange={setDark} />} />
<ListTile title="Dense item" dense onPress={handleTap} />
```
