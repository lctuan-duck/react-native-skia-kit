# AppBar Component

## Mục đích
- Thanh tiêu đề trên cùng của màn hình.
- Hỗ trợ title, leading (back button), actions (icon buttons), elevation.

## Flutter tương đương
- `AppBar`, `SliverAppBar`, `CupertinoNavigationBar`

## Kiến trúc: Composition (Row + Box + Text + Icon)

> **AppBar = `<Box>` (nền) + `<Row>` (leading + title + actions).**
> Sử dụng Yoga layout — children tự xếp ngang, không cần x/y thủ công.

## TypeScript Interface

```ts
interface AppBarProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;              // default: 360
  height?: number;             // default: 56
  title?: string;
  titleWidget?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode[];
  backgroundColor?: string;    // default: theme.colors.primary
  foregroundColor?: string;    // default: theme.colors.onPrimary
  elevation?: number;          // default: 4
  centerTitle?: boolean;       // default: false
  onBack?: () => void;
}
```

## Core Implementation

```tsx
import React from 'react';
import { Box, Text, Icon, Row, Expanded, IconButton } from 'react-native-skia-kit';
// Note: IconButton = <Button variant="icon" /> shortcut
import { useNav } from '../hooks/useNav';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';

export const AppBar = React.memo(function AppBar({
  x = 0, y = 0,
  width = 360, height = 56,
  title,
  titleWidget,
  leading,
  actions,
  backgroundColor,        // undefined → theme.colors.primary
  foregroundColor,         // undefined → theme.colors.onPrimary
  elevation = 4,
  centerTitle = false,
  onBack,
}: AppBarProps) {
  const theme = useTheme();
  const nav = useNav();

  const bgColor = backgroundColor ?? theme.colors.primary;
  const fgColor = foregroundColor ?? theme.colors.onPrimary;

  useWidget<{ title?: string }>({
    type: 'AppBar',
    layout: { x, y, width, height },
    props: { title },
  });

  // Auto back button
  const leadingWidget = leading ?? (
    (onBack || nav.canGoBack()) ? (
      <IconButton
        icon="arrow-left" size={24} tapSize={40}
        color={fgColor}
        onPress={() => onBack ? onBack() : nav.pop()}
      />
    ) : null
  );

  return (
    <Box x={x} y={y} width={width} height={height}
      color={bgColor} elevation={elevation}
      flexDirection="row" alignItems="center" padding={[0, 8, 0, 8]}
    >
      {/* Leading — Yoga tự đặt bên trái */}
      {leadingWidget}

      {/* Title — Expanded chiếm phần còn lại */}
      <Expanded>
        {titleWidget ?? (
          <Text
            text={title ?? ''}
            fontSize={20} fontWeight="bold"
            color={fgColor}
            textAlign={centerTitle ? 'center' : 'left'}
          />
        )}
      </Expanded>

      {/* Actions — Yoga tự đặt bên phải */}
      {actions && (
        <Row gap={4}>
          {actions.map((action, i) => (
            <React.Fragment key={i}>{action}</React.Fragment>
          ))}
        </Row>
      )}
    </Box>
  );
});
```

> Không còn `<Row x={...} y={...}>` lồng bên trong — Box đã là flex container.

## Cách dùng

### Cơ bản
```tsx
<AppBar title="Trang chủ" />
```

### Có back button + actions
```tsx
<AppBar
  title="Tin nhắn"
  onBack={() => nav.pop()}
  actions={[
    <IconButton icon="search" color={theme.colors.onPrimary} onPress={openSearch} />,
    <IconButton icon="more" color={theme.colors.onPrimary} onPress={openMenu} />,
  ]}
/>
```

### Custom title widget
```tsx
<AppBar
  backgroundColor="white" foregroundColor="black"
  leading={<IconButton icon="menu" color={theme.colors.textBody} onPress={openDrawer} />}
  titleWidget={
    <Row gap={8} crossAxisAlignment="center">
      <Avatar size={32} src={user.avatar} />
      <Column gap={2}>
        <Text text={user.name} fontSize={16} fontWeight="bold" />
        <Text text="Online" fontSize={12} color={theme.colors.success} />
      </Column>
    </Row>
  }
/>
```

## Links
- Base: [Box.md](./Box.md), [Row.md](./Row.md), [Expanded.md](./Expanded.md)
- Related: [BottomNavigationBar.md](./BottomNavigationBar.md), [Button.md](./Button.md)
