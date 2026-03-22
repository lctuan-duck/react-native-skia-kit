# ListTile Component

## Mục đích
- Item trong danh sách — icon/avatar bên trái, title + subtitle, trailing widget bên phải.
- Pattern phổ biến nhất trong Flutter, dùng cho Settings, Contacts, Menu, etc.

## Flutter tương đương
- `ListTile`, `CheckboxListTile`, `SwitchListTile`, `RadioListTile`

## TypeScript Interface

```ts
interface ListTileProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;            // default: 360
  height?: number;           // default: 56 (auto nếu có subtitle: 72)

  // Content
  title: string;             // REQUIRED — dòng chính
  subtitle?: string;         // Dòng mô tả
  leading?: React.ReactNode; // Icon/Avatar bên trái
  trailing?: React.ReactNode;// Widget bên phải (Switch, Checkbox, Icon...)

  // Appearance
  titleColor?: string;       // default: theme.colors.textBody
  subtitleColor?: string;    // default: theme.colors.textSecondary
  backgroundColor?: string;  // default: transparent
  contentPadding?: number;   // default: 16

  // Events
  onPress?: () => void;
  onLongPress?: () => void;
  dense?: boolean;           // default: false — compact mode (height: 48)
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `title` | `string` | — | ✅ | Title text |
| `subtitle` | `string` | — | ❌ | Subtitle text |
| `leading` | `ReactNode` | — | ❌ | Widget bên trái |
| `trailing` | `ReactNode` | — | ❌ | Widget bên phải |
| `titleColor` | `string` | `theme.textBody` | ❌ | Màu title |
| `subtitleColor` | `string` | `theme.textSecondary` | ❌ | Màu subtitle |
| `backgroundColor` | `string` | `transparent` | ❌ | Màu nền |
| `dense` | `boolean` | `false` | ❌ | Compact mode |
| `onPress` | `() => void` | — | ❌ | Tap callback |

## Kiến trúc: Composition (Row + Column + Text)

> **ListTile = `<Box>` (row layout) + `leading` + `<Column>` (title/subtitle) + `trailing`.**
> Dùng Yoga flex — children tự xếp ngang.

## Core Implementation

```tsx
import React from 'react';
import { Box, Text, Row, Column, Expanded } from 'react-native-skia-kit';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';

export const ListTile = React.memo(function ListTile({
  x = 0, y = 0,
  width = 360,
  height,
  title,
  subtitle,
  leading,
  trailing,
  titleColor,
  subtitleColor,
  backgroundColor,
  contentPadding = 16,
  dense = false,
  onPress,
  onLongPress,
}: ListTileProps) {
  const theme = useTheme();
  const fgTitle = titleColor ?? theme.colors.textBody;
  const fgSubtitle = subtitleColor ?? theme.colors.textSecondary;
  const bgColor = backgroundColor ?? 'transparent';

  // Auto height: dense=48, subtitle=72, default=56
  const tileHeight = height ?? (dense ? 48 : subtitle ? 72 : 56);

  useWidget({
    type: 'ListTile',
    layout: { x, y, width, height: tileHeight },
  });

  // Box handles onPress/onLongPress via props — no useHitTest needed

  return (
    <Box
      x={x} y={y} width={width} height={tileHeight}
      color={bgColor}
      flexDirection="row" alignItems="center"
      padding={[0, contentPadding, 0, contentPadding]}
      gap={16}
      hitTestBehavior="opaque"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Leading — Icon/Avatar */}
      {leading}

      {/* Content — Title + Subtitle */}
      <Expanded>
        <Column gap={2} justifyContent="center">
          <Text
            text={title}
            fontSize={dense ? 14 : 16}
            color={fgTitle}
          />
          {subtitle && (
            <Text
              text={subtitle}
              fontSize={dense ? 12 : 14}
              color={fgSubtitle}
            />
          )}
        </Column>
      </Expanded>

      {/* Trailing — Switch/Checkbox/Icon */}
      {trailing}
    </Box>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<ListTile title="Đặng Tuấn" subtitle="Online" />
```

### Với leading/trailing
```tsx
<ListTile
  leading={<Avatar size={40} src={user.avatar} />}
  title={user.name}
  subtitle={user.email}
  trailing={<Icon name="arrow-right" size={20} />}
  onPress={() => nav.push('Profile', { id: user.id })}
/>
```

### Settings list
```tsx
<Column x={0} y={56} width={360} gap={0}>
  <ListTile
    leading={<Icon name="bell" size={24} />}
    title="Thông báo"
    trailing={<Switch value={notif} onChange={setNotif} />}
  />
  <Divider />
  <ListTile
    leading={<Icon name="lock" size={24} />}
    title="Bảo mật"
    subtitle="Mật khẩu, vân tay"
    trailing={<Icon name="arrow-right" size={20} />}
    onPress={() => nav.push('Security')}
  />
  <Divider />
  <ListTile
    leading={<Icon name="info" size={24} />}
    title="Phiên bản"
    trailing={<Text text="1.2.3" fontSize={14} color={theme.colors.textSecondary} />}
  />
</Column>
```

### Dense mode
```tsx
<ListTile dense title="Menu Item 1" onPress={action1} />
<ListTile dense title="Menu Item 2" onPress={action2} />
```

## Links
- Base: [Box.md](./Box.md), [Row.md](./Row.md), [Column.md](./Column.md), [Expanded.md](./Expanded.md)
- Related: [Avatar.md](./Avatar.md), [Divider.md](./Divider.md), [Switch.md](./Switch.md)
