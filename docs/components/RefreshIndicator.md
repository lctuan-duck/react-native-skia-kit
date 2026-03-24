# RefreshIndicator

Pull-to-refresh spinner. Tương đương Flutter `RefreshIndicator`.

## Interface

```ts
type RefreshIndicatorStyle = ColorStyle & FlexChildStyle & { width?: number; };

interface RefreshIndicatorProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  color?: SemanticColor;         // default: 'primary'
  displacement?: number;         // default: 40
  screenWidth?: number;
  style?: RefreshIndicatorStyle;
}
```

## Cách dùng

```tsx
<RefreshIndicator onRefresh={fetchData} color="info">
  <ScrollView style={{ width: 360, height: 600 }}>
    <ListTile title="Item 1" />
  </ScrollView>
</RefreshIndicator>
```
