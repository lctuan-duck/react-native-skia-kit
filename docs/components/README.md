# Component Documentation

> **API v2** — Unified `style` prop architecture

## Quy tắc chung

### Style Prop
Tất cả visual props (width, height, color, padding, borderRadius, ...) được gom vào `style` prop duy nhất:

```tsx
<Box style={{ width: 200, height: 100, backgroundColor: '#fff', borderRadius: 12 }}>
  <Text style={{ fontSize: 16, color: '#333', fontWeight: 'bold' }} text="Hello" />
</Box>
```

### Semantic Shorthand Props
UI components giữ một số shorthand props cho rapid development:

| Prop | Type | Mô tả |
|------|------|--------|
| `variant` | component-specific | Kiểu hiển thị (solid, outline, ghost, link...) |
| `color` | `SemanticColor` | Màu semantic — **KHÔNG nhận hex/rgb** |
| `disabled` | `boolean` | Trạng thái disabled |

**SemanticColor**: `'primary'` \| `'secondary'` \| `'success'` \| `'info'` \| `'warning'` \| `'error'` \| `'neutral'`

Custom hex color → dùng `style.backgroundColor` hoặc `style.color`.

### Ưu tiên
```
style prop > shorthand props > theme defaults
```

## Base Style Types

Defined in `src/core/style.types.ts`. Component styles extend từ các type này.

| Type | Props |
|------|-------|
| `LayoutStyle` | `width`, `height`, `overflow` |
| `SpacingStyle` | `padding`, `margin` |
| `ColorStyle` | `backgroundColor`, `opacity` |
| `BorderStyle` | `borderRadius`, `borderColor`, `borderWidth` |
| `ShadowStyle` | `elevation`, `zIndex` |
| `FlexChildStyle` | `flex`, `flexGrow`, `flexShrink`, `flexBasis`, `alignSelf`, `position`, `top/left/right/bottom` |
| `FlexContainerStyle` | `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`, `gap`, `rowGap` |
| `SkiaTextStyle` | `fontSize`, `fontFamily`, `fontWeight`, `fontStyle`, `color`, `textAlign`, `lineHeight`, `letterSpacing` |

## Component Index

### Base
[Box](./Box.md) · [Text](./Text.md) · [Row](./Row.md) · [Column](./Column.md)

### Layout
[Expanded](./Expanded.md) · [Center](./Center.md) · [Stack](./Stack.md) · [Wrap](./Wrap.md) · [Spacer](./Spacer.md)

### UI Components
[Button](./Button.md) · [Card](./Card.md) · [Badge](./Badge.md) · [Chip](./Chip.md) · [Avatar](./Avatar.md)

### Form
[Input](./Input.md) · [Checkbox](./Checkbox.md) · [Radio](./Radio.md) · [Switch](./Switch.md) · [Slider](./Slider.md) · [DropdownButton](./DropdownButton.md)

### Display
[Divider](./Divider.md) · [ListTile](./ListTile.md) · [ExpansionTile](./ExpansionTile.md) · [Tooltip](./Tooltip.md) · [SnackBar](./SnackBar.md) · [Progress](./Progress.md) · [Image](./Image.md) · [Icon](./Icon.md)

### Navigation
[Scaffold](./Scaffold.md) · [AppBar](./AppBar.md) · [BottomNavigationBar](./BottomNavigationBar.md) · [TabBar](./TabBar.md) · [TabBarView](./TabBarView.md) · [Nav](./Nav.md) · [SearchBar](./SearchBar.md)

### Overlay / Gesture
[Overlay](./Overlay.md) · [Modal](./Modal.md) · [BottomSheet](./BottomSheet.md) · [Drawer](./Drawer.md) · [GestureDetector](./GestureDetector.md) · [Dismissible](./Dismissible.md) · [Draggable](./Draggable.md) · [PopupMenuButton](./PopupMenuButton.md)

### Scroll / List
[ScrollView](./ScrollView.md) · [GridView](./GridView.md) · [PageView](./PageView.md) · [VirtualizedList](./VirtualizedList.md) · [RefreshIndicator](./RefreshIndicator.md)

### Other
[SafeArea](./SafeArea.md) · [Hero](./Hero.md) · [Form](./Form.md) · [CanvasRoot](./CanvasRoot.md)
