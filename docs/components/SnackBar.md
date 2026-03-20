# SnackBar Component

## Mục đích
- Thông báo tạm thời hiện ở dưới màn hình, tự biến mất sau vài giây.

## Flutter tương đương
- `SnackBar`, `ScaffoldMessenger.showSnackBar`

## TypeScript Interface

```ts
interface SnackBarProps extends WidgetProps {
  visible?: boolean;
  message: string;
  action?: { label: string; onPress: () => void };
  duration?: number;       // default: 3000ms
  backgroundColor?: string;
  textColor?: string;
  screenWidth?: number;
  screenHeight?: number;
  onDismiss?: () => void;
}
```

## Core Implementation

```tsx
import React, { useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Box, Text, Row, Expanded } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit/hooks';

export const SnackBar = React.memo(function SnackBar({
  visible = false,
  message,
  action,
  duration = 3000,
  backgroundColor,       // undefined → theme.colors.inverseSurface
  textColor,             // undefined → theme.colors.textInverse
  screenWidth = 360,
  screenHeight = 800,
  onDismiss,
}: SnackBarProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.inverseSurface;
  const fgColor = textColor ?? theme.colors.textInverse;

  const translateY = useSharedValue(80);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 200 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(80, { duration: 200 });
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(80, { duration: 200 });
    }
  }, [visible]);

  return (
    <Box
      x={8} y={screenHeight - 72}
      width={screenWidth - 16} height={48}
      borderRadius={8} color={bgColor} elevation={6}
      flexDirection="row" alignItems="center" padding={[0, 16, 0, 16]}
    >
      <Expanded>
        <Text text={message} fontSize={14} color={fgColor} />
      </Expanded>
      {action && (
        <Text
          text={action.label} fontSize={14} fontWeight="bold"
          color={theme.colors.primary} onPress={action.onPress}
        />
      )}
    </Box>
  );
});
```

## Cách dùng

```tsx
<SnackBar
  visible={showSnack}
  message="Đã xóa thành công"
  action={{ label: 'HOÀN TÁC', onPress: undo }}
  onDismiss={() => setShowSnack(false)}
/>
```

## Links
- Base: [Box.md](./Box.md), [Row.md](./Row.md), [Expanded.md](./Expanded.md)
