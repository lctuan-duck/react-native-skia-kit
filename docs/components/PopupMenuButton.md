# PopupMenuButton Component

## Mục đích
- Menu popup hiện ra khi bấm nút — hiển thị danh sách options.
- Dùng overlayStore để render nổi trên UI.

## Flutter tương đương
- `PopupMenuButton`, `PopupMenuItem`, `showMenu`

## TypeScript Interface

```ts
interface PopupMenuItem<T> {
  value: T;
  label: string;
  icon?: string;
  enabled?: boolean;         // default: true
  divider?: boolean;         // default: false — divider sau item này
}

interface PopupMenuButtonProps<T> extends WidgetProps {
  x?: number;
  y?: number;

  // Content
  items: PopupMenuItem<T>[];
  onSelected?: (value: T) => void;

  // Trigger
  child?: React.ReactNode;   // Custom trigger widget
  icon?: string;             // default: 'more' — icon khi không có child

  // Appearance
  menuWidth?: number;        // default: 200
  menuElevation?: number;    // default: 8
  menuColor?: string;        // default: theme.colors.surface
  menuBorderRadius?: number; // default: 8
  offset?: { dx: number; dy: number }; // default: { dx: 0, dy: 0 }
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `items` | `PopupMenuItem<T>[]` | — | ✅ | Menu items |
| `onSelected` | `(value: T) => void` | — | ❌ | Selection callback |
| `child` | `ReactNode` | — | ❌ | Custom trigger |
| `icon` | `string` | `'more'` | ❌ | Icon trigger |
| `menuWidth` | `number` | `200` | ❌ | Menu width |
| `menuColor` | `string` | `theme.surface` | ❌ | Menu background |

## Core Implementation

```tsx
import React, { useCallback } from 'react';
import { Box, Text, Icon, Column, Divider, Overlay } from 'react-native-skia-kit';
import { useOverlayStore } from '../store/overlayStore';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';

export const PopupMenuButton = React.memo(function PopupMenuButton<T>({
  x = 0, y = 0,
  items,
  onSelected,
  child,
  icon = 'more',
  menuWidth = 200,
  menuElevation = 8,
  menuColor,
  menuBorderRadius = 8,
  offset = { dx: 0, dy: 0 },
}: PopupMenuButtonProps<T>) {
  const theme = useTheme();
  const bgColor = menuColor ?? theme.colors.surface;
  const showOverlay = useOverlayStore(s => s.showOverlay);
  const hideOverlay = useOverlayStore(s => s.hideOverlay);

  const menuId = `popup-menu-${x}-${y}`;

  useWidget({
    type: 'PopupMenuButton',
    layout: { x, y, width: 40, height: 40 },
  });

  const openMenu = useCallback(() => {
    const menuX = x + offset.dx;
    const menuY = y + 40 + offset.dy;

    showOverlay(menuId, (
      <>
        {/* Backdrop — bấm để đóng */}
        <Overlay visible onPress={() => hideOverlay(menuId)} />

        {/* Menu */}
        <Box
          x={menuX} y={menuY}
          width={menuWidth}
          borderRadius={menuBorderRadius}
          color={bgColor}
          elevation={menuElevation}
          flexDirection="column"
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <Box
                width={menuWidth} height={44}
                flexDirection="row" alignItems="center"
                padding={[0, 16, 0, 16]} gap={12}
                hitTestBehavior="opaque"
                opacity={item.enabled === false ? 0.5 : 1}
                onPress={() => {
                  if (item.enabled !== false) {
                    hideOverlay(menuId);
                    onSelected?.(item.value);
                  }
                }}
              >
                {item.icon && (
                  <Icon name={item.icon} size={20} color={theme.colors.textSecondary} />
                )}
                <Text text={item.label} fontSize={14} color={theme.colors.textBody} />
              </Box>
              {item.divider && <Divider length={menuWidth - 32} />}
            </React.Fragment>
          ))}
        </Box>
      </>
    ), 200);
  }, [items, onSelected]);

  return (
    <Box
      x={x} y={y} width={40} height={40}
      hitTestBehavior="opaque"
      onPress={openMenu}
      flexDirection="column" justifyContent="center" alignItems="center"
    >
      {child ?? <Icon name={icon} size={24} color={theme.colors.textBody} />}
    </Box>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<PopupMenuButton
  items={[
    { value: 'edit', label: 'Chỉnh sửa', icon: 'edit' },
    { value: 'share', label: 'Chia sẻ', icon: 'share' },
    { value: 'delete', label: 'Xóa', icon: 'trash', divider: true },
  ]}
  onSelected={(action) => handleAction(action)}
/>
```

### Trong AppBar
```tsx
<AppBar
  title="Detail"
  actions={[
    <PopupMenuButton
      items={[
        { value: 'save', label: 'Lưu' },
        { value: 'print', label: 'In' },
        { value: 'settings', label: 'Cài đặt' },
      ]}
      onSelected={handleMenuAction}
    />
  ]}
/>
```

### Custom trigger
```tsx
<PopupMenuButton
  child={<Button text="Options" variant="outlined" />}
  items={sortOptions}
  onSelected={setSortBy}
/>
```

## Links
- Base: [Box.md](./Box.md), [Icon.md](./Icon.md), [Overlay.md](./Overlay.md)
- Store: [overlay-store.md](../store-design/overlay-store.md)
- Related: [DropdownButton.md](./DropdownButton.md), [AppBar.md](./AppBar.md)
