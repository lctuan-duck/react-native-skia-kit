# Box Component

## Mục đích
- Container cơ bản (tương đương `Container`/`DecoratedBox` của Flutter).
- **Là base component cốt lõi** — hầu hết component khác đều compose từ Box.
- Hỗ trợ flex layout, style, padding, background, border, shadow, events.

## Flutter tương đương
- `Container`, `DecoratedBox`, `SizedBox`, `Padding`

## ⚡ Layout Model (Flutter Constraint-Based)

> **Box sử dụng mô hình layout theo Flutter:**
> 1. **Constraints Go Down**: Parent truyền giới hạn (min/max width/height) xuống Box
> 2. **Sizes Go Up**: Box tự tính kích thước dựa trên constraints và nội dung
> 3. **Parent Sets Position**: Parent đặt Box vào vị trí `(x, y)` — **bạn KHÔNG cần set `x`, `y`**

### Greedy vs Humble
- **Box = Greedy** (mặc định): tự dãn ra chiếm cross-axis của parent (giống CSS `display: block`)
- Trong `Column` parent: Box auto width = parent width, height cần set hoặc dùng `flex`
- Trong `Row` parent: Box auto height = parent height, width cần set hoặc dùng `flex`

### Default width/height = `undefined`
- Box **không có** width/height mặc định cố định
- Khi là child của flex container: parent inject width/height qua `cloneElement`
- Khi là root: **phải set** width/height rõ ràng

## TypeScript Interface

```ts
interface BoxProps extends WidgetProps {
  // ===== Layout (tự động bởi parent flex — thường KHÔNG cần set) =====
  x?: number;              // Vị trí X — parent inject tự động
  y?: number;              // Vị trí Y — parent inject tự động
  width?: number;          // Chiều rộng — auto stretch trong Column, hoặc set cố định
  height?: number;         // Chiều cao — auto stretch trong Row, hoặc set cố định

  // ===== Style =====
  color?: string;          // Màu nền (default: 'transparent')
  borderRadius?: number;   // Bo góc (px)
  borderWidth?: number;    // Độ dày viền
  borderColor?: string;    // Màu viền
  opacity?: number;        // Độ mờ (0–1)
  elevation?: number;      // Đổ bóng (shadow depth)
  overflow?: 'visible' | 'hidden';  // Ẩn/hiện phần tràn

  // ===== Flex Container Props (khi Box là parent) =====
  flexDirection?: 'row' | 'column';
    // 'row'    → children xếp NGANG (→), main axis = ngang, cross axis = dọc
    // 'column' → children xếp DỌC (↓), main axis = dọc, cross axis = ngang

  justifyContent?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
    // Căn chỉnh children trên MAIN AXIS (chiều chính)
    // 'start'        → dồn về đầu
    // 'center'       → căn giữa
    // 'end'          → dồn về cuối
    // 'spaceBetween' → khoảng cách đều, không padding hai đầu
    // 'spaceAround'  → khoảng cách đều, có padding hai đầu
    // 'spaceEvenly'  → khoảng cách hoàn toàn đều

  alignItems?: 'start' | 'center' | 'end' | 'stretch';
    // Căn chỉnh children trên CROSS AXIS (chiều vuông góc)
    // DEFAULT: 'stretch' — children tự dãn full cross axis
    // 'start'   → dồn về đầu cross axis
    // 'center'  → căn giữa cross axis
    // 'end'     → dồn về cuối cross axis
    // 'stretch' → dãn full cross axis (⚠️ ĐÂY LÀ DEFAULT)

  gap?: number;            // Khoảng cách giữa children (px)
  rowGap?: number;         // Khoảng cách giữa hàng khi flexWrap
  flexWrap?: 'nowrap' | 'wrap';  // Xuống dòng khi tràn
  padding?: number | [number, number, number, number]; // [top, right, bottom, left]

  // ===== Flex Child Props (khi Box là child) =====
  flex?: number;           // Chiếm tỉ lệ main axis còn lại (giống Flutter Expanded)
  flexGrow?: number;       // Alias cho flex
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
    // Override alignItems của parent cho riêng Box này

  position?: 'relative' | 'absolute';  // 'absolute' = thoát khỏi flow
  top?: number;            // Offset (chỉ khi position='absolute')
  left?: number;
  right?: number;
  bottom?: number;

  // ===== Events =====
  onPress?: () => void;
  onLongPress?: () => void;
  onPanStart?: (e: PanEvent) => void;
  onPanUpdate?: (e: PanEvent) => void;
  onPanEnd?: (e: PanEvent) => void;
  onLayout?: (layout: LayoutRect) => void;

  hitTestBehavior?: HitTestBehavior;  // default: 'deferToChild'
  zIndex?: number;
  children?: React.ReactNode;
}
```

## Cách dùng

### ✅ Auto layout (recommended — không cần x, y)
```tsx
{/* Column: children tự xếp dọc, auto stretch width */}
<Column width={360} height={800} gap={12} padding={16}>
  <Box height={50} color="red" />      {/* width auto = 360 - 32 (padding) */}
  <Box height={80} color="blue" />     {/* width auto = 328 */}
  <Box flex={1} color="green" />       {/* fill hết height còn lại */}
</Column>
```

### Row layout — spaceBetween
```tsx
<Box flexDirection="row" justifyContent="spaceBetween" alignItems="center" padding={16}>
  <Text text="Title" fontSize={20} fontWeight="bold" flex={1} />
  <Icon name="menu" size={24} />
</Box>
```

### Card với flex
```tsx
<Box
  height={72}
  borderRadius={12}
  color="white"
  elevation={2}
  flexDirection="row"
  alignItems="center"
  padding={12}
  gap={10}
>
  <Box width={36} height={36} borderRadius={10} color="#E8F0FE"
    flexDirection="column" justifyContent="center" alignItems="center">
    <Icon name="menu" size={20} color="#1A73E8" />
  </Box>
  <Column flex={1} mainAxisAlignment="center">
    <Text text="Danh sách hóa đơn" fontSize={13} fontWeight="600" />
  </Column>
</Box>
```

### Event handling
```tsx
<Box height={48} color="#1A73E8" borderRadius={8}
  hitTestBehavior="opaque"
  onPress={() => console.log('Pressed!')}
  flexDirection="row" justifyContent="center" alignItems="center"
>
  <Text text="Bấm vào đây" color="white" fontWeight="bold" />
</Box>
```

## Layout Engine Flow

```
Box nhận props
│
├── CÓ flex props? (flexDirection || justifyContent || alignItems || gap)
│   │
│   ├── YES → useYogaLayout() chạy:
│   │         1. Constraints Go Down (parent size → child constraints)
│   │         2. Sizes Go Up (children resolve sizes: greedy/humble)
│   │         3. Parent Sets Position → cloneElement inject x,y,w,h
│   │
│   └── NO  → render children nguyên bản
│
└── Skia render: Group → Shadow → Background → Border → Children
```

## Links
- Layout: [Column.md](./Column.md), [Row.md](./Row.md), [Expanded.md](./Expanded.md), [ScrollView.md](./ScrollView.md)
- Engine: [useYogaLayout.md](../hooks/useYogaLayout.md)
