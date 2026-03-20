# BottomSheet Component

## Mục đích
- Sheet trượt lên từ dưới màn hình, hỗ trợ kéo lên/xuống.

## Flutter tương đương
- `showModalBottomSheet`, `DraggableScrollableSheet`

## TypeScript Interface

```ts
interface BottomSheetProps extends WidgetProps {
  visible?: boolean;
  height?: number;         // default: 400
  screenWidth?: number;
  screenHeight?: number;
  backgroundColor?: string;
  borderRadius?: number;   // default: 24
  showHandle?: boolean;    // default: true
  onClose?: () => void;
  children?: React.ReactNode;
}
```

## Core Implementation

```tsx
import React from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Box, Overlay, Column, Center } from 'react-native-skia-kit';
import { useWidget } from 'react-native-skia-kit/hooks';
import { useTheme } from 'react-native-skia-kit/hooks';

export const BottomSheet = React.memo(function BottomSheet({
  visible = false,
  height = 400,
  screenWidth = 360,
  screenHeight = 800,
  backgroundColor,        // undefined → theme.colors.surface
  borderRadius = 24,
  showHandle = true,
  onClose,
  children,
}: BottomSheetProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.surface;
  const sheetY = useSharedValue(screenHeight);

  React.useEffect(() => {
    sheetY.value = withSpring(visible ? screenHeight - height : screenHeight);
  }, [visible, height]);

  useWidget({ type: 'BottomSheet', layout: { x: 0, y: screenHeight - height, width: screenWidth, height } });

  if (!visible) return null;

  return (
    <>
      <Overlay visible={visible} onPress={onClose} />
      <Box
        x={0} y={screenHeight - height}
        width={screenWidth} height={height}
        color={bgColor} borderRadius={borderRadius} elevation={16}
        flexDirection="column" alignItems="center"
      >
        {/* Handle bar */}
        {showHandle && (
          <Box width={40} height={4} borderRadius={2} color={theme.colors.border} margin={[8, 0, 16, 0]} />
        )}

        {/* Content — Yoga tự xếp dọc */}
        {children}
      </Box>
    </>
  );
});
```

## Cách dùng

```tsx
<BottomSheet visible={showSheet} height={300} onClose={() => setShowSheet(false)}>
  <Column padding={16} gap={12} width={360}>
    <Text text="Chọn hành động" fontSize={18} fontWeight="bold" />
    <Divider />
    <Button text="Chụp ảnh" onPress={takePhoto} />
    <Button text="Chọn từ thư viện" onPress={pickImage} />
    <Button text="Hủy" color={theme.colors.surfaceVariant} textColor={theme.colors.textBody} onPress={() => setShowSheet(false)} />
  </Column>
</BottomSheet>
```

## Links
- Base: [Box.md](./Box.md), [Overlay.md](./Overlay.md), [Column.md](./Column.md)
- Related: [Modal.md](./Modal.md), [Drawer.md](./Drawer.md)
