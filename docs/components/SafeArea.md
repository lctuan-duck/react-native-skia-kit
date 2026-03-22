# SafeArea Component

## Mục đích
- Tránh vùng system UI: notch, status bar, home indicator.
- Tự động offset nội dung con để không bị đè lên.

## Flutter tương đương
- `SafeArea` widget

## TypeScript Interface

```ts
interface SafeAreaProps extends WidgetProps, YogaFlexProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];  // default: all
  color?: string;           // background color
  insets?: {                // custom override (auto-detect nếu không set)
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}
```

## Cách sử dụng

```tsx
import { SafeArea, Box, Text } from 'react-native-skia-kit';

function App() {
  return (
    <SafeArea x={0} y={0} width={360} height={800}>
      <Text text="Nội dung dưới status bar" />
    </SafeArea>
  );
}

// Chỉ tránh top (notch/status bar)
<SafeArea edges={['top']} x={0} y={0} width={360} height={800}>
  ...
</SafeArea>

// Custom insets
<SafeArea insets={{ top: 60, bottom: 40 }} x={0} y={0} width={360} height={800}>
  ...
</SafeArea>
```

## Cách hoạt động
1. Đọc insets từ `Platform` + `StatusBar.currentHeight` (Android) hoặc defaults (iOS: top=44, bottom=34)
2. Offset children theo edges được chọn
3. Nếu truyền `insets` prop → dùng giá trị custom, skip auto-detect

## Nguồn tham khảo
- [Flutter SafeArea](https://api.flutter.dev/flutter/widgets/SafeArea-class.html)
