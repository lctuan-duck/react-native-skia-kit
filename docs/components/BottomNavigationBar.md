# BottomNavigationBar Component

## Mục đích
- Thanh điều hướng dưới cùng với nhiều tab (icon + label).

## Flutter tương đương
- `BottomNavigationBar`, `NavigationBar` (Material 3)

## TypeScript Interface

```ts
interface BottomNavItem {
  icon: string;
  label: string;
  activeIcon?: string;
}

interface BottomNavigationBarProps extends WidgetProps {
  x?: number;
  y?: number;              // auto: screenHeight - height
  width?: number;          // default: 360
  height?: number;         // default: 64
  items: BottomNavItem[];
  activeIndex?: number;
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  elevation?: number;
  onChange?: (index: number) => void;
}
```

## Core Implementation

```tsx
import React from 'react';
import { Box, Row, Column, Text, Icon, Expanded } from 'react-native-skia-kit';
import { useWidget } from 'react-native-skia-kit/hooks';
import { useTheme } from 'react-native-skia-kit/hooks';

export const BottomNavigationBar = React.memo(function BottomNavigationBar({
  x = 0, y,
  width = 360, height = 64,
  items,
  activeIndex = 0,
  backgroundColor,        // undefined → theme.colors.surface
  activeColor,            // undefined → theme.colors.primary
  inactiveColor,           // undefined → theme.colors.textSecondary
  elevation = 8,
  onChange,
}: BottomNavigationBarProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.surface;
  const active = activeColor ?? theme.colors.primary;
  const inactive = inactiveColor ?? theme.colors.textSecondary;
  const barY = y ?? 800 - height;

  useWidget<{ activeIndex: number }>({
    type: 'BottomNavigationBar',
    layout: { x, y: barY, width, height },
    props: { activeIndex },
  });

  return (
    <Box x={x} y={barY} width={width} height={height}
      color={bgColor} elevation={elevation}
      flexDirection="row"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const color = isActive ? active : inactive;
        const iconName = isActive && item.activeIcon ? item.activeIcon : item.icon;

        return (
          <Expanded key={index}>
            <Box
              height={height}
              hitTestBehavior="opaque"
              onPress={() => onChange?.(index)}
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              gap={2}
            >
              <Icon name={iconName} size={24} color={color} />
              <Text text={item.label} fontSize={11} color={color}
                fontWeight={isActive ? 'bold' : 'normal'}
              />
            </Box>
          </Expanded>
        );
      })}
    </Box>
  );
});
```

> Dùng `<Expanded>` cho mỗi tab → chia đều width. Yoga tự tính.

## Cách dùng

```tsx
const [activeTab, setActiveTab] = useState(0);

<BottomNavigationBar
  items={[
    { icon: 'home', label: 'Home' },
    { icon: 'search', label: 'Tìm kiếm' },
    { icon: 'bell', label: 'Thông báo' },
    { icon: 'user', label: 'Tôi' },
  ]}
  activeIndex={activeTab}
  onChange={setActiveTab}
/>
```

## Links
- Base: [Box.md](./Box.md), [Row.md](./Row.md), [Expanded.md](./Expanded.md)
- Related: [AppBar.md](./AppBar.md), [TabBar.md](./TabBar.md)
