# VirtualizedList Component

## Mục đích
- Viewport-based lazy rendering cho danh sách lớn (1000+ items).
- Chỉ render items **trong viewport + buffer zone**, không render items ngoài vùng nhìn thấy.

## Flutter tương đương
- `ListView.builder`, `SliverList`

## Khác biệt với ScrollView

| | ScrollView | VirtualizedList |
|---|---|---|
| Render | Tất cả children | Chỉ viewport + buffer |
| Use case | < 50 items | 100+ items |
| API | `children` (JSX) | `data` + `renderItem` (builder) |
| Performance | ❌ Chậm với data lớn | ✅ Tối ưu |

## TypeScript Interface

```ts
interface VirtualizedListProps<T> extends WidgetProps {
  data: T[];                   // Mảng dữ liệu
  itemHeight: number;          // Chiều cao mỗi item (bắt buộc)
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  bufferCount?: number;        // Items render ngoài viewport (default: 5)
  separatorHeight?: number;    // Khoảng cách giữa items (default: 0)
}
```

## Cách sử dụng

```tsx
import { VirtualizedList, Box, Text } from 'react-native-skia-kit';

function ProductList({ products }) {
  return (
    <VirtualizedList
      x={0} y={60}
      width={360} height={600}
      data={products}
      itemHeight={72}
      bufferCount={5}
      separatorHeight={1}
      renderItem={(product, index) => (
        <Box x={0} y={index * 73} width={360} height={72} color="#FFF">
          <Text x={16} y={index * 73 + 16} text={product.name} fontSize={16} />
          <Text x={16} y={index * 73 + 40} text={product.price} fontSize={14} color="#999" />
        </Box>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
```

## Kiến trúc nội bộ

```
┌─────────────────┐
│   Buffer (~5)    │ ← Render trước (phía trên)
├─────────────────┤
│   Viewport      │ ← Phần nhìn thấy
├─────────────────┤
│   Buffer (~5)    │ ← Render trước (phía dưới)
└─────────────────┘
Items ngoài buffer → KHÔNG render
```

1. `useSharedValue(0)` — lưu scroll offset
2. `useHitTest` — bắt pan gesture để scroll
3. `withDecay` — momentum scrolling
4. `useMemo` — chỉ render items trong visible range
5. `Group` + `clip` + `transform` — viewport clipping

## Hooks sử dụng
- `useWidget` — đăng ký vào widget tree
- `useHitTest` — pan gesture cho scrolling
- `useDerivedValue` — animated scroll transform

## Nguồn tham khảo
- [Flutter ListView.builder](https://api.flutter.dev/flutter/widgets/ListView/ListView.builder.html)
- [Flutter SliverList](https://api.flutter.dev/flutter/widgets/SliverList-class.html)
