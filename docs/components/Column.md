# Column Component

## Mục đích
- Sắp xếp children theo chiều **dọc** (↓ vertical).
- Wrapper mỏng trên `Box` với `flexDirection="column"`.

## Flutter tương đương
- `Column`

## ⚡ Layout Behavior

> **Children bên trong Column KHÔNG CẦN `x`, `y`, `width`.** Layout engine inject tự động.

| Trục | Hướng | Thuộc tính |
|------|-------|-----------|
| **Main axis** | ↓ Dọc (vertical) | `mainAxisAlignment` điều khiển |
| **Cross axis** | → Ngang (horizontal) | `crossAxisAlignment` điều khiển |

### Mặc định:
- Children **auto stretch width** = parent width (cross axis stretch)
- Children cần **explicit height** hoặc dùng `flex={1}` để fill

## Props

```ts
interface ColumnProps extends WidgetProps {
  // ===== Vị trí container (thường do parent inject) =====
  x?: number;
  y?: number;
  width?: number;          // Chiều rộng container
  height?: number;         // Chiều cao container

  // ===== Main Axis (↓ DỌC) =====
  mainAxisAlignment?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
    // Căn chỉnh children theo chiều DỌC
    // default: 'start' — dồn lên trên

  // ===== Cross Axis (→ NGANG) =====
  crossAxisAlignment?: 'start' | 'center' | 'end' | 'stretch';
    // Căn chỉnh children theo chiều NGANG
    // default: 'stretch' — children tự dãn full width

  gap?: number;            // Khoảng cách dọc giữa children (px)
  padding?: number | [top, right, bottom, left];
  color?: string;          // Màu nền (default: 'transparent')
  borderRadius?: number;

  children?: React.ReactNode;
}
```

## Cách dùng

### Basic — children auto stretch width
```tsx
<Column width={360} height={400} gap={8} padding={16}>
  <Text text="Title" fontSize={18} fontWeight="bold" />     {/* width = 328 auto */}
  <Box height={50} color="red" />                            {/* width = 328 auto */}
  <Box flex={1} color="blue" />                              {/* fill remaining height */}
</Column>
```

### Center content
```tsx
<Column width={360} height={800}
  mainAxisAlignment="center"    {/* ↓ căn giữa dọc */}
  crossAxisAlignment="center"   {/* → căn giữa ngang */}
  gap={16}
>
  <Icon name="check" size={64} color="green" />
  <Text text="Thành công!" fontSize={24} fontWeight="bold" />
</Column>
```

### Card với text căn giữa dọc
```tsx
<Box height={72} flexDirection="row" alignItems="center" padding={12} gap={10}>
  <Icon name="star" size={24} />
  <Column flex={1} mainAxisAlignment="center">
    <Text text="Title" fontSize={14} fontWeight="bold" />
    <Text text="Subtitle" fontSize={12} color="gray" />
  </Column>
</Box>
```

## Links
- Base: [Box.md](./Box.md)
- Related: [Row.md](./Row.md), [Expanded.md](./Expanded.md)
