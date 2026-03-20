# TabBar Component

## Mục đích
- Thanh tab/segment chuyển đổi giữa các content views.
- Hỗ trợ 2 styles: tab (underline indicator) và segment (pill background).

## Flutter tương đương
- `TabBar` + `TabBarView`, `CupertinoSegmentedControl`, `SegmentedButton`

## TypeScript Interface

```ts
type TabBarVariant = 'tab' | 'segment';

interface TabItem {
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface TabBarProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;             // default: 360
  height?: number;            // default: 48

  // Data
  items: TabItem[];
  activeIndex?: number;       // default: 0
  onChanged?: (index: number) => void;

  // Appearance
  variant?: TabBarVariant;    // default: 'tab'
  activeColor?: string;       // default: theme.colors.primary
  inactiveColor?: string;     // default: theme.colors.textSecondary
  backgroundColor?: string;   // default: theme.colors.surface (tab), theme.colors.surfaceVariant (segment)
  indicatorColor?: string;    // default: activeColor
  borderRadius?: number;      // default: 24 (segment)
  scrollable?: boolean;       // default: false — cho nhiều tab
}
```

## Core Implementation

```tsx
import React from 'react';
import { Box, Row, Text, Icon, Expanded } from 'react-native-skia-kit';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useWidget } from 'react-native-skia-kit/hooks';
import { useTheme } from 'react-native-skia-kit/hooks';

export const TabBar = React.memo(function TabBar({
  x = 0, y = 0,
  width = 360, height = 48,
  items, activeIndex = 0,
  onChanged,
  variant = 'tab',
  activeColor,            // undefined → theme.colors.primary
  inactiveColor,           // undefined → theme.colors.textSecondary
  backgroundColor,
  indicatorColor,
  borderRadius = 24,
  scrollable = false,
}: TabBarProps) {
  const theme = useTheme();
  const active = activeColor ?? theme.colors.primary;
  const inactive = inactiveColor ?? theme.colors.textSecondary;
  const bgColor = backgroundColor ?? (variant === 'segment' ? theme.colors.surfaceVariant : theme.colors.surface);
  const indicator = indicatorColor ?? active;

  useWidget({ type: 'TabBar', layout: { x, y, width, height } });

  // === SEGMENT variant ===
  if (variant === 'segment') {
    return (
      <Box x={x} y={y} width={width} height={height}
        borderRadius={borderRadius} color={bgColor}
        flexDirection="row" padding={2}
      >
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <Expanded key={i}>
              <Box
                height={height - 4}
                borderRadius={borderRadius - 2}
                color={isActive ? 'white' : 'transparent'}
                elevation={isActive ? 2 : 0}
                hitTestBehavior="opaque"
                onPress={() => !item.disabled && onChanged?.(i)}
                opacity={item.disabled ? 0.4 : 1}
                flexDirection="row" justifyContent="center" alignItems="center"
                gap={item.icon ? 6 : 0}
              >
                {item.icon && (
                  <Icon name={item.icon} size={16}
                    color={isActive ? activeColor : inactiveColor} />
                )}
                <Text text={item.label} fontSize={13} fontWeight={isActive ? 'bold' : 'normal'}
                  color={isActive ? activeColor : inactiveColor} />
              </Box>
            </Expanded>
          );
        })}
      </Box>
    );
  }

  // === TAB variant (underline indicator) ===
  const tabWidth = width / items.length;

  return (
    <Box x={x} y={y} width={width} height={height} color={bgColor}
      flexDirection="row"
    >
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <Expanded key={i}>
            <Box
              height={height}
              hitTestBehavior="opaque"
              onPress={() => !item.disabled && onChanged?.(i)}
              opacity={item.disabled ? 0.4 : 1}
              flexDirection="column" justifyContent="center" alignItems="center"
            >
              <Row gap={item.icon ? 6 : 0}>
                {item.icon && (
                  <Icon name={item.icon} size={18}
                    color={isActive ? activeColor : inactiveColor} />
                )}
                <Text text={item.label} fontSize={14}
                  fontWeight={isActive ? 'bold' : 'normal'}
                  color={isActive ? activeColor : inactiveColor} />
              </Row>
              {/* Underline indicator */}
              {isActive && (
                <Box width={tabWidth * 0.6} height={3}
                  borderRadius={1.5} color={indicator} />
              )}
            </Box>
          </Expanded>
        );
      })}
    </Box>
  );
});
```

## Cách dùng

### Tab — page navigation
```tsx
const [tab, setTab] = useState(0);

<TabBar
  items={[
    { label: 'Tất cả' },
    { label: 'Chưa đọc', icon: 'mail' },
    { label: 'Đã gắn sao', icon: 'star' },
  ]}
  activeIndex={tab}
  onChanged={setTab}
/>

{/* Content */}
{tab === 0 && <AllMessages />}
{tab === 1 && <UnreadMessages />}
{tab === 2 && <StarredMessages />}
```

### Segment — mode toggle
```tsx
<TabBar
  variant="segment"
  width={280} height={40}
  items={[
    { label: 'Light' },
    { label: 'Dark' },
    { label: 'System' },
  ]}
  activeIndex={themeIndex}
  onChanged={setThemeIndex}
/>
```

### Tab with icon
```tsx
<TabBar
  items={[
    { label: 'Chat', icon: 'message' },
    { label: 'Contacts', icon: 'users' },
    { label: 'Settings', icon: 'cog' },
  ]}
  activeIndex={tab}
  onChanged={setTab}
  activeColor="#7c3aed"
/>
```

## Links
- Base: [Box.md](./Box.md), [Row.md](./Row.md), [Expanded.md](./Expanded.md)
- Related: [BottomNavigationBar.md](./BottomNavigationBar.md)
