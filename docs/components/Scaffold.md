# Scaffold Component

## Mục đích
- Cung cấp layout scaffold chuẩn cho một màn hình: AppBar + body + BottomNavigationBar + FAB + Drawer.
- Tự động xử lý vị trí, tránh overlap giữa AppBar/BottomNav/body.

## Flutter tương đương
- `Scaffold`, `ScaffoldMessenger`

## TypeScript Interface

```ts
interface ScaffoldProps extends WidgetProps {
  width?: number;              // default: 360
  height?: number;             // default: 800 (screen height)

  // Slots
  appBar?: React.ReactNode;    // AppBar phía trên
  body: React.ReactNode;       // REQUIRED — nội dung chính
  bottomNavigationBar?: React.ReactNode;  // BottomNav phía dưới
  floatingActionButton?: React.ReactNode; // FAB
  drawer?: React.ReactNode;              // Side drawer

  // FAB position
  fabPosition?: 'bottomRight' | 'bottomCenter' | 'bottomLeft'; // default: 'bottomRight'

  // Appearance
  backgroundColor?: string;   // default: theme.colors.background
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `body` | `ReactNode` | — | ✅ | Nội dung chính |
| `appBar` | `ReactNode` | — | ❌ | AppBar trên cùng |
| `bottomNavigationBar` | `ReactNode` | — | ❌ | Bottom nav |
| `floatingActionButton` | `ReactNode` | — | ❌ | FAB |
| `drawer` | `ReactNode` | — | ❌ | Side drawer |
| `fabPosition` | `string` | `'bottomRight'` | ❌ | Vị trí FAB |
| `backgroundColor` | `string` | `theme.background` | ❌ | Nền màn hình |

## Kiến trúc: Composition (Box + slots)

> **Scaffold = `<Box>` (full screen) + AppBar slot + body + BottomNav + FAB overlay.**
> Scaffold tự tính vùng body dựa trên có/không có AppBar, BottomNav.

```
┌─────────────────────────┐ ← Scaffold (0,0, 360, 800)
│ ┌─────────────────────┐ │
│ │      AppBar (56px)   │ │ ← slot: appBar
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │      body           │ │ ← slot: body (auto height)
│ │                     │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │   BottomNav (64px)   │ │ ← slot: bottomNavigationBar
│ └─────────────────────┘ │
│                    [FAB] │ ← slot: floatingActionButton
└─────────────────────────┘
```

## Core Implementation

```tsx
import React from 'react';
import { Group } from '@shopify/react-native-skia';
import { Box } from 'react-native-skia-kit';
import { useTheme } from '../hooks/useTheme';

export const Scaffold = React.memo(function Scaffold({
  width = 360,
  height = 800,
  appBar,
  body,
  bottomNavigationBar,
  floatingActionButton,
  drawer,
  fabPosition = 'bottomRight',
  backgroundColor,
}: ScaffoldProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.background;

  // Tính vùng body dựa trên slots
  const appBarHeight = appBar ? 56 : 0;
  const bottomNavHeight = bottomNavigationBar ? 64 : 0;
  const bodyY = appBarHeight;
  const bodyHeight = height - appBarHeight - bottomNavHeight;

  // FAB position
  const fabPositions = {
    bottomRight: { x: width - 72, y: height - bottomNavHeight - 72 },
    bottomCenter: { x: width / 2 - 28, y: height - bottomNavHeight - 72 },
    bottomLeft: { x: 16, y: height - bottomNavHeight - 72 },
  };
  const fabPos = fabPositions[fabPosition];

  return (
    <Group>
      {/* Background */}
      <Box x={0} y={0} width={width} height={height} color={bgColor} />

      {/* AppBar */}
      {appBar && (
        <Group>
          {React.cloneElement(appBar as React.ReactElement, {
            x: 0, y: 0, width,
          })}
        </Group>
      )}

      {/* Body — clipped to available area */}
      <Group clip={{ x: 0, y: bodyY, width, height: bodyHeight }}>
        {body}
      </Group>

      {/* Bottom Navigation Bar */}
      {bottomNavigationBar && (
        <Group>
          {React.cloneElement(bottomNavigationBar as React.ReactElement, {
            x: 0, y: height - bottomNavHeight, width,
          })}
        </Group>
      )}

      {/* Floating Action Button */}
      {floatingActionButton && (
        <Group>
          {React.cloneElement(floatingActionButton as React.ReactElement, {
            x: fabPos.x, y: fabPos.y,
          })}
        </Group>
      )}

      {/* Drawer — rendered last to overlay */}
      {drawer}
    </Group>
  );
});
```

## Cách dùng

### Cơ bản — AppBar + body
```tsx
<Scaffold
  appBar={<AppBar title="Home" />}
  body={
    <ScrollView y={56} height={744}>
      <Column padding={16} gap={12}>
        <Card variant="elevated"><Text text="Card 1" /></Card>
        <Card variant="elevated"><Text text="Card 2" /></Card>
      </Column>
    </ScrollView>
  }
/>
```

### Full layout — AppBar + BottomNav + FAB
```tsx
<Scaffold
  appBar={<AppBar title="Tasks" />}
  body={
    <ScrollView y={56} height={680}>
      {tasks.map(task => (
        <ListTile key={task.id} title={task.title} subtitle={task.date} />
      ))}
    </ScrollView>
  }
  bottomNavigationBar={
    <BottomNavigationBar
      items={[
        { icon: 'home', label: 'Home' },
        { icon: 'search', label: 'Search' },
        { icon: 'user', label: 'Profile' },
      ]}
      activeIndex={tab}
      onChange={setTab}
    />
  }
  floatingActionButton={
    <Button variant="fab" icon="plus" onPress={addTask} />
  }
/>
```

### Với Drawer
```tsx
const [showDrawer, setShowDrawer] = useState(false);

<Scaffold
  appBar={
    <AppBar
      title="App"
      leading={<IconButton icon="menu" onPress={() => setShowDrawer(true)} />}
    />
  }
  body={<HomeContent />}
  drawer={
    <Drawer visible={showDrawer} onClose={() => setShowDrawer(false)}>
      <Column padding={16} gap={8}>
        <ListTile title="Settings" onPress={goSettings} />
        <ListTile title="About" onPress={goAbout} />
      </Column>
    </Drawer>
  }
/>
```

## Links
- Base: [Box.md](./Box.md)
- Slots: [AppBar.md](./AppBar.md), [BottomNavigationBar.md](./BottomNavigationBar.md), [Drawer.md](./Drawer.md)
- Related: [Button.md](./Button.md) (FAB variant), [CanvasRoot.md](./CanvasRoot.md)
