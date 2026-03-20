# ExpansionTile Component

## Mục đích
- Accordion collapse/expand — header bấm để mở/đóng nội dung.
- Hỗ trợ animation mượt khi expand/collapse.

## Flutter tương đương
- `ExpansionTile`, `ExpansionPanel`, `ExpansionPanelList`

## TypeScript Interface

```ts
interface ExpansionTileProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;            // default: 360

  // Content
  title: string;             // REQUIRED
  subtitle?: string;
  leading?: React.ReactNode;
  children: React.ReactNode; // REQUIRED — nội dung bên trong khi mở

  // State
  initiallyExpanded?: boolean; // default: false
  onExpansionChanged?: (expanded: boolean) => void;

  // Appearance
  backgroundColor?: string;    // default: transparent
  collapsedBackgroundColor?: string; // default: transparent
  iconColor?: string;          // default: theme.colors.textSecondary
  tilePadding?: number;        // default: 16
  childrenPadding?: number;    // default: 16
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `title` | `string` | — | ✅ | Header title |
| `children` | `ReactNode` | — | ✅ | Expanded content |
| `subtitle` | `string` | — | ❌ | Subtitle |
| `leading` | `ReactNode` | — | ❌ | Icon bên trái |
| `initiallyExpanded` | `boolean` | `false` | ❌ | Mở sẵn |
| `backgroundColor` | `string` | `transparent` | ❌ | Nền khi mở |
| `iconColor` | `string` | `theme.textSecondary` | ❌ | Màu chevron |

## Core Implementation

```tsx
import React, { useState } from 'react';
import { Box, Text, Icon, Column, Row, Expanded } from 'react-native-skia-kit';
import { useAnimation } from '../hooks/useAnimation';
import { useTheme } from '../hooks/useTheme';

export const ExpansionTile = React.memo(function ExpansionTile({
  x = 0, y = 0,
  width = 360,
  title,
  subtitle,
  leading,
  children,
  initiallyExpanded = false,
  onExpansionChanged,
  backgroundColor,
  collapsedBackgroundColor,
  iconColor,
  tilePadding = 16,
  childrenPadding = 16,
}: ExpansionTileProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const expandAnim = useAnimation(initiallyExpanded ? 1 : 0);
  const chevronColor = iconColor ?? theme.colors.textSecondary;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    next ? expandAnim.forward({ duration: 200 }) : expandAnim.reverse({ duration: 200 });
    onExpansionChanged?.(next);
  };

  const bgColor = expanded
    ? (backgroundColor ?? 'transparent')
    : (collapsedBackgroundColor ?? 'transparent');

  return (
    <Column x={x} y={y} width={width}>
      {/* Header — always visible */}
      <Box
        width={width} height={subtitle ? 72 : 56}
        color={bgColor}
        flexDirection="row" alignItems="center"
        padding={[0, tilePadding, 0, tilePadding]}
        gap={16}
        hitTestBehavior="opaque"
        onPress={toggle}
      >
        {leading}
        <Expanded>
          <Column gap={2}>
            <Text text={title} fontSize={16} color={theme.colors.textBody} />
            {subtitle && (
              <Text text={subtitle} fontSize={14} color={theme.colors.textSecondary} />
            )}
          </Column>
        </Expanded>
        {/* Chevron — rotate khi expand */}
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20} color={chevronColor}
        />
      </Box>

      {/* Content — animated height */}
      {expanded && (
        <Box width={width} padding={childrenPadding} color={bgColor}>
          {children}
        </Box>
      )}
    </Column>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<ExpansionTile title="Chi tiết đơn hàng">
  <Text text="Sản phẩm A x 2" />
  <Text text="Sản phẩm B x 1" />
  <Text text="Tổng: 500,000đ" fontWeight="bold" />
</ExpansionTile>
```

### Settings accordion
```tsx
<Column gap={0}>
  <ExpansionTile title="Tài khoản" leading={<Icon name="user" />}>
    <ListTile title="Đổi mật khẩu" />
    <ListTile title="Xóa tài khoản" />
  </ExpansionTile>
  <Divider />
  <ExpansionTile title="Thông báo" leading={<Icon name="bell" />}>
    <ListTile title="Push" trailing={<Switch value={push} onChange={setPush} />} />
    <ListTile title="Email" trailing={<Switch value={email} onChange={setEmail} />} />
  </ExpansionTile>
</Column>
```

## Links
- Base: [Box.md](./Box.md), [Column.md](./Column.md), [ListTile.md](./ListTile.md)
- Animation: [useAnimation.md](../hooks/useAnimation.md)
