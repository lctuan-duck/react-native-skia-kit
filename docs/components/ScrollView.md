# ScrollView Component

## Mục đích
- Container cuộn nội dung theo chiều dọc/ngang.
- Hỗ trợ scroll physics (iOS bouncing, Android clamped).

## Flutter tương đương
- `SingleChildScrollView`, `ListView`

## ⚡ Layout Behavior

> **Children bên trong ScrollView được wrap trong Column tự động.** Không cần `x`, `y`.

### Auto contentSize:
- Khi **không truyền** `contentSize` → engine tự estimate từ children:
  - Cộng tất cả children heights (explicit hoặc intrinsic estimate)
  - Text: `fontSize × 1.4`, Icon: `size`, Unknown: `48`
- Khi **truyền** `contentSize` → dùng giá trị đó

## Props

```ts
interface ScrollViewProps extends WidgetProps {
  width?: number;           // Chiều rộng viewport (default: 360)
  height?: number;          // Chiều cao viewport (default: 600)
  horizontal?: boolean;     // Cuộn ngang thay vì dọc (default: false)

  physics?: 'clamped' | 'bouncing';
    // 'clamped'  → Android style: dừng tại giới hạn
    // 'bouncing' → iOS style: rubber band + spring

  contentSize?: number;     // Tổng chiều cao/rộng nội dung (auto nếu không set)
  scrollEnabled?: boolean;  // Cho phép cuộn (default: true)
  padding?: number;         // Padding bên trong

  children?: React.ReactNode;
}
```

## Cách dùng

### Auto contentSize (recommended)
```tsx
<ScrollView width={360} height={600} physics="bouncing">
  <Box height={200} color="green" />      {/* height known: 200 */}
  <Box height={100} color="blue" />       {/* height known: 100 */}
  <Text text="Hello" fontSize={18} />     {/* height estimated: 26 */}
  <Box height={400} color="red" />        {/* height known: 400 */}
</ScrollView>
{/* Total contentSize auto = 200 + 100 + 26 + 400 = 726 > viewport 600 → scrollable */}
```

### Explicit contentSize
```tsx
<ScrollView width={360} height={600} contentSize={1200} physics="bouncing">
  {/* children... */}
</ScrollView>
```

## Links
- Layout: [Box.md](./Box.md), [Column.md](./Column.md)
