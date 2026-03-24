# ScrollView / GridView / PageView

Cuộn nội dung. Tương đương Flutter `ListView` / `GridView` / `PageView`.

## ScrollView Interface

```ts
type ScrollViewStyle = ColorStyle & FlexChildStyle & { width?: number; height?: number; };

interface ScrollViewProps {
  x?: number; y?: number;
  children: React.ReactNode;
  physics?: 'clamping' | 'bouncing';
  showScrollbar?: boolean;
  style?: ScrollViewStyle;
}
```

## GridView Interface

```ts
type GridViewStyle = ColorStyle & FlexChildStyle & { width?: number; height?: number; };

interface GridViewProps {
  x?: number; y?: number;
  children: React.ReactNode;
  crossAxisCount: number;
  spacing?: number;
  physics?: 'clamping' | 'bouncing';
  style?: GridViewStyle;
}
```

## PageView Interface

```ts
type PageViewStyle = ColorStyle & FlexChildStyle & { width?: number; height?: number; };

interface PageViewProps {
  x?: number; y?: number;
  children: React.ReactNode;
  initialPage?: number;
  onPageChanged?: (page: number) => void;
  style?: PageViewStyle;
}
```

## Cách dùng

```tsx
// ScrollView
<ScrollView style={{ width: 360, height: 600 }} physics="bouncing">
  <ListTile title="Item 1" />
  <ListTile title="Item 2" />
</ScrollView>

// GridView
<GridView crossAxisCount={2} spacing={8} style={{ width: 360, height: 600 }}>
  <Card style={{ padding: 16 }}>...</Card>
  <Card style={{ padding: 16 }}>...</Card>
</GridView>

// PageView
<PageView style={{ width: 360, height: 400 }} onPageChanged={setPage}>
  <Page1 />
  <Page2 />
</PageView>
```
