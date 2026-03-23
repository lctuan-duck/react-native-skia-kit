# Text Component

## Mục đích
- Hiển thị văn bản trên Skia canvas.
- Hỗ trợ font, màu, kích thước, alignment, multiline, ellipsis.

## Flutter tương đương
- `Text`, `RichText`

## ⚡ Layout Behavior

> **Text = "Humble" widget** — chỉ chiếm vừa đủ kích thước nội dung.

| Ngữ cảnh | Width | Height |
|-----------|-------|--------|
| Trong **Column** | auto stretch = parent width | auto = `fontSize × 1.4` |
| Trong **Row** | auto estimate = `text.length × fontSize × 0.55` | auto stretch = parent height |
| Có **`flex={1}`** | fill remaining space | (giữ nguyên) |
| Set **explicit** | giá trị bạn set | giá trị bạn set |

### Quan trọng:
- ⚠️ Text trong **Row** nên dùng `flex={1}` nếu muốn chiếm hết chiều ngang còn lại
- Text **auto-height** từ `fontSize` khi không set `height` explicit
- Không render string trực tiếp trong Skia — phải dùng `<Text>` component

## Props

```ts
interface TextProps extends WidgetProps {
  // ===== Content =====
  text?: string;           // Nội dung text
  children?: string;       // Alternative: <Text>Hello</Text>

  // ===== Typography =====
  fontSize?: number;       // Cỡ chữ (default: 14)
  fontFamily?: string;     // Font (default: theme font)
  fontWeight?: 'normal' | 'bold' | '100' | ... | '900';  // Độ đậm
  fontStyle?: 'normal' | 'italic';
  color?: string;          // Màu chữ (default: theme.colors.textBody)
  opacity?: number;        // Độ mờ (0–1)

  // ===== Text Layout =====
  textAlign?: 'left' | 'center' | 'right';  // Căn chỉnh trong box (default: 'left')
  numberOfLines?: number;  // Giới hạn số dòng
  ellipsis?: boolean;      // Hiện "..." khi tràn
  lineHeight?: number;     // Chiều cao dòng (px)
  letterSpacing?: number;  // Khoảng cách giữa ký tự

  // ===== Flex Child Props =====
  flex?: number;           // Chiếm tỉ lệ main axis (dùng trong Row)
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';

  // ===== Layout (thường KHÔNG cần set — parent inject) =====
  x?: number;              // Parent inject tự động
  y?: number;              // Parent inject tự động
  width?: number;          // Auto hoặc parent inject (default: 300 standalone)
  height?: number;         // Auto = paragraph.getHeight()

  // ===== Events =====
  onPress?: () => void;
  onLongPress?: () => void;
}
```

## Cách dùng

### Trong Column (auto width, auto height)
```tsx
<Column width={360} gap={8} padding={16}>
  <Text text="Tiêu đề" fontSize={20} fontWeight="bold" />
  <Text text="Mô tả chi tiết ở đây..." fontSize={14} color="gray" />
</Column>
{/* Text1: width=328(auto), height=28(fontSize*1.4) */}
{/* Text2: width=328(auto), height=20(fontSize*1.4) */}
```

### Trong Row (cần flex={1})
```tsx
<Box flexDirection="row" justifyContent="spaceBetween" alignItems="center">
  <Text text="Title" fontSize={16} fontWeight="bold" flex={1} />
  <Text text="Action" fontSize={13} color="#1A73E8" />
</Box>
```

### Multiline + ellipsis
```tsx
<Text
  text="Đây là đoạn text dài sẽ bị cắt nếu vượt quá 2 dòng..."
  fontSize={14}
  numberOfLines={2}
  ellipsis
/>
```

## Links
- Layout: [Box.md](./Box.md), [Column.md](./Column.md), [Row.md](./Row.md)
