# Components Overview

Tổng hợp **49 component files** (bao gồm nhiều variant trong mỗi file) trong react-native-skia-kit.

## 🏗 Layout (8)

| Component | Flutter tương đương | Mô tả |
|-----------|-------------------|------|
| [Box](./Box.md) | `Container` | Container cơ bản — nền, border, padding, Yoga flex |
| [Row](./Row.md) | `Row` | Flex horizontal layout |
| [Column](./Column.md) | `Column` | Flex vertical layout |
| [Stack](./Stack.md) | `Stack` + `Positioned` | Xếp chồng, absolute positioning |
| [Expanded](./Expanded.md) | `Expanded` + `Flexible` | Flex children cho Row/Column |
| [Center](./Center.md) | `Center` + `Align` | Căn giữa / căn vị trí |
| [Wrap](./Wrap.md) | `Wrap` | Flex wrap — tự xuống hàng |
| [Spacer](./Spacer.md) | `SizedBox` | Khoảng trống cố định |

## 📝 Text & Input (3)

| Component | Flutter tương đương | Mô tả |
|-----------|-------------------|------|
| [Text](./Text.md) | `Text` | Text rendering |
| [Input](./Input.md) | `TextField` | Text input |
| [SearchBar](./SearchBar.md) | `SearchBar` | Thanh tìm kiếm (pill-shaped input + icon) |

## 🔘 Controls (7)

| Component | Variants | Flutter tương đương |
|-----------|----------|-------------------|
| [Button](./Button.md) | `filled`, `ghost`, `elevated`, `outlined`, `text`, `icon`, `fab` | `ElevatedButton`, `IconButton`, `FAB` |
| [Checkbox](./Checkbox.md) | — | `Checkbox` |
| [Radio](./Radio.md) | — | `Radio` |
| [Switch](./Switch.md) | — | `Switch` |
| [Slider](./Slider.md) | — | `Slider` |
| [DropdownButton](./DropdownButton.md) | — | `DropdownButton` |
| [PopupMenuButton](./PopupMenuButton.md) | — | `PopupMenuButton` |

## 📊 Display (10)

| Component | Flutter tương đương | Mô tả |
|-----------|-------------------|------|
| [Image](./Image.md) | `Image` | Hiển thị ảnh |
| [Icon](./Icon.md) | `Icon` | Hiển thị icon |
| [Card](./Card.md) | `Card` | Card elevation |
| [Avatar](./Avatar.md) | `CircleAvatar` | Avatar tròn |
| [Badge](./Badge.md) | `Badge` | Badge số |
| [Chip](./Chip.md) | `Chip` | Chip tag |
| [Divider](./Divider.md) | `Divider` | Đường phân cách |
| [Tooltip](./Tooltip.md) | `Tooltip` | Tooltip hover |
| [ListTile](./ListTile.md) | `ListTile` | List item (leading + title + trailing) |
| [ExpansionTile](./ExpansionTile.md) | `ExpansionTile` | Accordion collapse/expand |

## 📈 Feedback (3)

| Component | Variants | Flutter tương đương |
|-----------|----------|-------------------|
| [Progress](./Progress.md) | `linear`, `circular` | `LinearProgressIndicator`, `CircularProgressIndicator` |
| [SnackBar](./SnackBar.md) | — | `SnackBar` |
| [RefreshIndicator](./RefreshIndicator.md) | — | `RefreshIndicator` |

## 🧭 Navigation (4)

| Component | Variants | Flutter tương đương |
|-----------|----------|-------------------|
| [Nav](./Nav.md) | — | `Navigator` |
| [AppBar](./AppBar.md) | — | `AppBar` |
| [BottomNavigationBar](./BottomNavigationBar.md) | — | `BottomNavigationBar` |
| [TabBar](./TabBar.md) | `tab`, `segment` | `TabBar`, `SegmentedControl` |
| [Hero](./Hero.md) | — | `Hero` | Shared element transition |

## 📦 Overlay (4)

| Component | Flutter tương đương | Mô tả |
|-----------|-------------------|------|
| [Modal](./Modal.md) | `AlertDialog` | Modal dialog |
| [BottomSheet](./BottomSheet.md) | `BottomSheet` | Sheet kéo từ dưới |
| [Overlay](./Overlay.md) | `ModalBarrier` | Overlay backdrop |
| [Drawer](./Drawer.md) | `Drawer` | Side drawer |

## 📜 Scroll & Pages (3)

| Component | Variants | Flutter tương đương |
|-----------|----------|-------------------|
| [ScrollView](./ScrollView.md) | static, `builder` (virtualized) | `SingleChildScrollView`, `ListView.builder` |
| [GridView](./GridView.md) | static, `builder` | `GridView.builder` |
| [PageView](./PageView.md) | — | `PageView` |

## 🖐 Gesture & Interaction (3)

| Component | Flutter tương đương | Mô tả |
|-----------|-------------------|------|
| [GestureDetector](./GestureDetector.md) | `GestureDetector` | Wrapper bắt gesture |
| [Dismissible](./Dismissible.md) | `Dismissible` | Swipe to dismiss |
| [Draggable](./Draggable.md) | `Draggable` + `DragTarget` | Drag & drop |

## 📋 Form (1)

| Component | Flutter tương đương | Mô tả |
|-----------|-------------------|------|
| [Form](./Form.md) | `Form` + `FormField` | Form validation |

## 🌐 Root (2)

| Component | Flutter tương đương | Mô tả |
|-----------|-------------------|------|
| [CanvasRoot](./CanvasRoot.md) | `MaterialApp` | Root canvas duy nhất |
| [Scaffold](./Scaffold.md) | `Scaffold` | Layout frame (AppBar + body + FAB + BottomNav + Drawer) |
