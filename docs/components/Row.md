# Row Component

## Mục đích
- Sắp xếp children theo chiều **ngang** (→ horizontal).
- Wrapper mỏng trên `Box` với `flexDirection="row"`.

## Flutter tương đương
- `Row`

## ⚡ Layout Behavior

> **Children bên trong Row KHÔNG CẦN `x`, `y`, `height`.** Layout engine inject tự động.

| Trục | Hướng | Thuộc tính |
|------|-------|-----------|
| **Main axis** | → Ngang (horizontal) | `mainAxisAlignment` điều khiển |
| **Cross axis** | ↓ Dọc (vertical) | `crossAxisAlignment` điều khiển |

### Mặc định:
- Children **auto stretch height** = parent height (cross axis stretch)
- Children cần **explicit width** hoặc dùng `flex={1}` để fill
- ⚠️ **Text** trong Row: tự estimate width từ nội dung, hoặc dùng `flex={1}` chiếm hết

## Props

```ts
interface RowProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;

  // ===== Main Axis (→ NGANG) =====
  mainAxisAlignment?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
    // Căn chỉnh children theo chiều NGANG
    // default: 'start' — dồn sang trái

  // ===== Cross Axis (↓ DỌC) =====
  crossAxisAlignment?: 'start' | 'center' | 'end' | 'stretch';
    // Căn chỉnh children theo chiều DỌC
    // default: 'center' — căn giữa dọc

  gap?: number;            // Khoảng cách ngang giữa children (px)
  padding?: number | [top, right, bottom, left];
  color?: string;
  borderRadius?: number;
  children?: React.ReactNode;
}
```

## Cách dùng

### Header — spaceBetween
```tsx
<Box flexDirection="row" justifyContent="spaceBetween" alignItems="center" padding={16}>
  <Text text="Thao tác nhanh" fontSize={16} fontWeight="bold" flex={1} />
  <Text text="Sắp xếp" fontSize={13} color="#1A73E8" />
</Box>
```

> ⚠️ Text đầu dùng `flex={1}` để chiếm hết chiều ngang còn lại. Text cuối chỉ chiếm vừa đủ nội dung.

### Icon + Text (card)
```tsx
<Row gap={8} crossAxisAlignment="center">
  <Icon name="star" size={20} color="gold" />
  <Text text="4.8" fontSize={16} fontWeight="bold" />
  <Text text="(128 reviews)" fontSize={13} color="gray" />
</Row>
```

### 2 cột bằng nhau
```tsx
<Row gap={12}>
  <Box flex={1} height={72} borderRadius={12} color="white" elevation={2}>
    {/* Card trái */}
  </Box>
  <Box flex={1} height={72} borderRadius={12} color="white" elevation={2}>
    {/* Card phải */}
  </Box>
</Row>
```

### Lưu ý khi dùng Text trong Row
```tsx
{/* ❌ SAI — Text nhận width từ estimate, có thể bị xuống dòng */}
<Row mainAxisAlignment="spaceBetween">
  <Text text="Long text here..." fontSize={16} />
  <Text text="Action" fontSize={13} />
</Row>

{/* ✅ ĐÚNG — Text dùng flex={1} để chiếm remaining space */}
<Row mainAxisAlignment="spaceBetween" alignItems="center">
  <Text text="Long text here..." fontSize={16} flex={1} />
  <Text text="Action" fontSize={13} />
</Row>
```

## Links
- Base: [Box.md](./Box.md)
- Related: [Column.md](./Column.md), [Expanded.md](./Expanded.md)
