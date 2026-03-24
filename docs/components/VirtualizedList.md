# VirtualizedList

Lazy-rendering list cho large data. Tương đương Flutter `ListView.builder`.

## Interface

```ts
interface VirtualizedListProps<T> {
  data: T[];
  width?: number;
  height?: number;
  itemHeight: number;             // BẮT BUỘC — fixed item height
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  bufferCount?: number;           // default: 5
  separatorHeight?: number;
}
```

## Cách dùng

```tsx
<VirtualizedList
  data={users}
  width={360} height={600}
  itemHeight={56}
  renderItem={(user, i) => <ListTile title={user.name} />}
  keyExtractor={(user) => user.id}
/>
```
