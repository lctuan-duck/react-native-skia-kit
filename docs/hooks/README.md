# Hooks Overview

Tổng hợp **8 hooks** trong react-native-skia-kit (4 core + 4 feature).

## Core Hooks

| Hook | Mục đích | Flutter tương đương |
|------|---------|-------------------|
| [useWidget](./useWidget.md) | Đăng ký widget + layout vào store | `createState()` |
| [useWidgetId](./useWidgetId.md) | Tạo unique ID cho widget | — |
| [useHitTest](./useHitTest.md) | Đăng ký vùng nhận event | `hitTest()` |
| [useYogaLayout](./useYogaLayout.md) | Tính layout bằng Yoga engine | `performLayout()` |

## Feature Hooks

| Hook | Mục đích | Flutter tương đương |
|------|---------|-------------------|
| [useNav](./useNav.md) | Navigation: push, pop, params | `Navigator.of(context)` |
| [useTheme](./useTheme.md) | Truy cập theme colors, spacing | `Theme.of(context)` |
| [useScrollPhysics](./useScrollPhysics.md) | Scroll physics (bounce/clamp) | `ScrollPhysics` |
| [useAnimation](./useAnimation.md) | Animation controller | `AnimationController` |

## Typical Usage

```tsx
function MyScreen() {
  const nav = useNav();       // navigation
  const theme = useTheme();   // theme colors

  return (
    <Column x={0} y={0} width={360} height={800}
      color={theme.colors.background} gap={16} padding={16}
    >
      <AppBar title="Home" backgroundColor={theme.colors.primary} />
      <Text text="Hello" color={theme.colors.textBody} fontSize={theme.typography.bodyLarge.fontSize} />
      <Button text="Detail" onPress={() => nav.push('Detail', { id: '1' })} />
    </Column>
  );
}
```
