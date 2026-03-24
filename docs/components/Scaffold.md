# Scaffold

Layout chính của màn hình: AppBar + body + BottomNav + FAB. Tương đương Flutter `Scaffold`.

## Interface

```ts
type ScaffoldStyle = ColorStyle & FlexChildStyle & { width?: number; height?: number; };

interface ScaffoldProps {
  appBar?: React.ReactNode;
  body: React.ReactNode;
  bottomNavigationBar?: React.ReactNode;
  floatingActionButton?: React.ReactNode;
  drawer?: React.ReactNode;
  fabPosition?: 'bottomRight' | 'bottomCenter' | 'bottomLeft';
  style?: ScaffoldStyle;
}
```

## Cách dùng

```tsx
<Scaffold
  appBar={<AppBar title="Home" />}
  body={<MyContent />}
  bottomNavigationBar={<BottomNavigationBar items={tabs} activeIndex={0} />}
  floatingActionButton={<Button icon="plus" variant="fab" />}
/>
```
