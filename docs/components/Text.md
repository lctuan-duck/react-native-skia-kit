# Text Component

## Mục đích
- Hiển thị văn bản, hỗ trợ font, màu, kích thước, alignment, multiline, ellipsis.
- Component base cho mọi text UI trong kit.

## Flutter tương đương
- `Text`, `RichText`, `DefaultTextStyle`

## Kiến trúc: Skia Paragraph Node

> **Text KHÔNG có Canvas riêng.** Text là một `<Paragraph>` (SkParagraph) vẽ trực tiếp vào Canvas chung của `CanvasRoot`.

```
CanvasRoot (<Canvas>)
└── Text → <Paragraph paragraph={...} x={x} y={y} width={width} />
```

## TypeScript Interface

```ts
interface TextProps extends WidgetProps {
  // Layout
  x?: number;               // default: 0
  y?: number;               // default: 0
  width?: number;           // default: 300

  // Content (một trong hai)
  text?: string;
  children?: string;

  // Typography
  fontSize?: number;        // default: 14
  fontFamily?: string;      // default: 'System'
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'; // default: 'normal'
  fontStyle?: 'normal' | 'italic'; // default: 'normal'
  color?: string;           // default: theme.colors.textBody
  opacity?: number;         // default: 1

  // Text layout
  textAlign?: 'left' | 'center' | 'right'; // default: 'left'
  numberOfLines?: number;
  ellipsis?: boolean;       // default: false
  lineHeight?: number;
  letterSpacing?: number;

  // Events
  onPress?: () => void;
  onLongPress?: () => void;
  onLayout?: (layout: LayoutRect) => void;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityRole?: string;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `width` | `number` | `300` | ❌ | Max width cho text wrap |
| `text` | `string` | — | ⚠️ | Nội dung text (hoặc dùng `children`) |
| `children` | `string` | — | ⚠️ | Nội dung text (thay thế `text`) |
| `fontSize` | `number` | `14` | ❌ | Cỡ chữ |
| `fontFamily` | `string` | `'System'` | ❌ | Font family |
| `fontWeight` | `string` | `'normal'` | ❌ | Độ đậm |
| `color` | `string` | `theme.textBody` | ❌ | Màu chữ |
| `opacity` | `number` | `1` | ❌ | Độ mờ |
| `textAlign` | `'left' \| 'center' \| 'right'` | `'left'` | ❌ | Căn chỉnh |
| `numberOfLines` | `number` | — | ❌ | Giới hạn số dòng |
| `ellipsis` | `boolean` | `false` | ❌ | Hiện "..." khi tràn |
| `lineHeight` | `number` | — | ❌ | Chiều cao dòng |
| `letterSpacing` | `number` | — | ❌ | Khoảng cách giữa chữ |
| `onPress` | `() => void` | — | ❌ | Tap callback |

## Core Implementation (với Store Integration)

```tsx
import { Paragraph, Skia, TextAlign } from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useTheme } from '../hooks/useTheme';
import { measureText } from '../functions/measureText';

export const Text = React.memo(function Text({
  x = 0, y = 0,
  width = 300,
  text,
  children,
  fontSize = 14,
  fontFamily = 'System',
  fontWeight = 'normal',
  color,                    // undefined → theme.colors.textBody
  textAlign = 'left',
  numberOfLines,
  ellipsis = false,
  opacity = 1,
  lineHeight,
  letterSpacing,
  onPress,
  onLongPress,
  hitTestBehavior = 'deferToChild',
  accessibilityLabel,
}: TextProps) {
  const theme = useTheme();
  const textColor = color ?? theme.colors.textBody;
  const content = text ?? (typeof children === 'string' ? children : '');

  // Đo kích thước text cho Yoga layout
  const measured = measureText(content, { fontSize, fontWeight, fontFamily, maxWidth: width });

  // === Hook thay thế boilerplate ===
  const widgetId = useWidget<{ text: string; fontSize: number; color: string }>({
    type: 'Text',
    layout: { x, y, width: measured.width, height: measured.height },
    props: { text: content, fontSize, color },
  });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width: measured.width, height: measured.height },
    callbacks: { onPress, onLongPress },
    behavior: hitTestBehavior,
  });

  // === Skia Paragraph ===
  const paragraph = useMemo(() => {
    const alignMap = {
      center: TextAlign.Center,
      right: TextAlign.Right,
      left: TextAlign.Left,
    };
    const p = Skia.ParagraphBuilder.Make(
      {
        maxLines: numberOfLines,
        ellipsis: ellipsis ? '...' : undefined,
        textAlign: alignMap[textAlign] ?? TextAlign.Left,
      },
      Skia.FontMgr.System()
    )
      .pushStyle({
        color: Skia.Color(textColor),
        fontSize,
        fontFamilies: [fontFamily],
        fontStyle: { weight: fontWeight === 'bold' ? 700 : 400 },
        letterSpacing,
        heightMultiplier: lineHeight ? lineHeight / fontSize : undefined,
      })
      .addText(content)
      .pop()
      .build();
    p.layout(width);
    return p;
  }, [content, fontSize, fontFamily, fontWeight, color, textAlign, numberOfLines, ellipsis, width, lineHeight, letterSpacing]);

  return (
    <Paragraph
      paragraph={paragraph}
      x={x}
      y={y}
      width={width}
      opacity={opacity}
    />
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<CanvasRoot>
  <Box x={16} y={100} width={328} height={80} color="white">
    <Text x={32} y={116} width={296} text="Tiêu đề" fontSize={20} fontWeight="bold" color="black" />
    <Text x={32} y={148} width={296} text="Mô tả chi tiết..." fontSize={14} color="gray" numberOfLines={2} ellipsis />
  </Box>
</CanvasRoot>
```

### Với children string
```tsx
<Text x={16} y={100} fontSize={16} color={theme.colors.textBody}>
  Hello World
</Text>
```

### Trong Button (composition)
```tsx
<Box x={16} y={100} width={200} height={48} color={theme.colors.primary} borderRadius={8} hitTestBehavior="opaque" onPress={login}>
  <Text x={32} y={116} width={168} text="Đăng nhập" color="white" fontWeight="bold" textAlign="center" />
</Box>
```

## Links
- Function: [measureText](../functions/measureText.md)
- Store: [widget-store.md](../store-design/widget-store.md), [layout-store.md](../store-design/layout-store.md)
- Integration: [integration.md](../store-design/integration.md)
- Phase: [phase3_base_widget.md](../plans/phase3_base_widget.md), [phase7_typography.md](../plans/phase7_typography.md)
