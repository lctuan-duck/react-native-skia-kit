# Input Component

## Mục đích
- Nhận dữ liệu text từ người dùng.
- Hỗ trợ 3 variants: outlined (viền), filled (nền), underlined (gạch dưới).

## Flutter tương đương
- `TextField`, `TextFormField` (với `OutlineInputBorder`, `UnderlineInputBorder`)

## TypeScript Interface

```ts
type InputVariant = 'outlined' | 'filled' | 'underlined';

interface InputProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;          // default: 280
  height?: number;         // default: 48
  value?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoFocus?: boolean;
  variant?: InputVariant;  // default: 'outlined' — hình dạng
  color?: string;          // default: theme.colors.borderFocused — focus color
  backgroundColor?: string; // default: auto từ variant
  borderRadius?: number;   // default: 8
  onChange?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

## Variants (SHAPE only)

### `outlined` (mặc định) — viền bao quanh
```tsx
<Input placeholder="Email" />
```

### `filled` — nền đầy, không viền
```tsx
<Input variant="filled" placeholder="Tìm kiếm" />
```

### `underlined` — chỉ gạch dưới
```tsx
<Input variant="underlined" placeholder="Tên" />
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `x` | `number` | `0` | ❌ | Top-left X |
| `y` | `number` | `0` | ❌ | Top-left Y |
| `width` | `number` | `280` | ❌ | Chiều rộng |
| `height` | `number` | `48` | ❌ | Chiều cao |
| `value` | `string` | `''` | ❌ | Giá trị text |
| `placeholder` | `string` | `''` | ❌ | Placeholder text |
| `secureTextEntry` | `boolean` | `false` | ❌ | Ẩn text (password) |
| `keyboardType` | `string` | `'default'` | ❌ | Loại bàn phím |
| `color` | `string` | `theme.borderFocused` | ❌ | Màu focus border |
| `onChange` | `(text: string) => void` | — | ❌ | Callback khi text thay đổi |
| `onFocus` | `() => void` | — | ❌ | Focus callback |
| `onBlur` | `() => void` | — | ❌ | Blur callback |

## Kiến trúc: Hybrid Composition (Native TextInput + Box + Text)

> **Input KHÔNG vẽ Skia nguyên thủy hoàn toàn.**
> Input dùng **native `TextInput` ẩn** (opacity: 0) để nhận event hệ thống,
> và vẽ UI bằng **Base Components** (`<Box>` làm background/viền, `<Text>` hiển thị hệ chữ).
> Chỉ có con trỏ nháy là dùng `<Rect>` vì tính chất animation đặc biệt.

## Nguyên lý Hybrid
- Native TextInput nằm đúng vị trí, hứng keyboard, autocomplete, copy/paste.
- Skia Base Components (`Box`, `Text`) lắng nghe `value` thay đổi để vẽ UI lừa thị giác.

## Core Implementation

```tsx
import { Group, Rect } from '@shopify/react-native-skia';
import { TextInput } from 'react-native';
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useRef, useState, useEffect } from 'react';
import { Box, Text } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit/hooks';

export function Input({
  x = 0, y = 0, width = 280, height = 48,
  value = '', placeholder = '',
  secureTextEntry = false,
  keyboardType = 'default',
  variant = 'outlined',
  color,                  // undefined → theme.colors.borderFocused
  backgroundColor,        // undefined → auto từ variant
  borderRadius = 8,
  onChange,
}) {
  const theme = useTheme();
  const focusColor = color ?? theme.colors.borderFocused;
  const placeholderColor = theme.colors.textDisabled;
  const textColor = theme.colors.textBody;

  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const cursorOpacity = useSharedValue(1);

  // Blinking cursor
  useEffect(() => {
    cursorOpacity.value = isFocused
      ? withRepeat(withTiming(0, { duration: 500 }), -1, true)
      : 1;
  }, [isFocused]);

  const displayText = secureTextEntry ? '•'.repeat(value.length) : value;
  const showPlaceholder = !displayText && placeholder;
  const cursorX = x + 14 + (displayText.length * 9.5); // Ước lượng vị trí con trỏ

  return (
    <>
      {/* === NATIVE LAYER === */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          position: 'absolute',
          left: x, top: y, width, height,
          opacity: 0,       // Ẩn hoàn toàn khỏi user
          fontSize: 16,
        }}
      />

      {/* === SKIA LAYER (Composition) === */}
      <Group>
        {/* Nền + Viền (tùy variant) */}
        {variant === 'underlined' ? (
          <>
            <Box x={x} y={y} width={width} height={height}
              color={backgroundColor ?? 'transparent'}
            />
            <Box x={x} y={y + height - 2} width={width} height={isFocused ? 2 : 1}
              color={isFocused ? focusColor : theme.colors.border}
            />
          </>
        ) : (
          <Box
            x={x} y={y} width={width} height={height}
            borderRadius={borderRadius}
            color={backgroundColor ?? (variant === 'filled' ? theme.colors.surfaceVariant : 'transparent')}
            borderWidth={variant === 'outlined' ? (isFocused ? 2 : 1) : 0}
            borderColor={variant === 'outlined' ? (isFocused ? focusColor : theme.colors.border) : 'transparent'}
          />
        )}

        {/* Text hiển thị (Dùng Text) */}
        <Text
          x={x + 14}
          y={y + height / 2 - 8}
          width={width - 28}
          text={showPlaceholder ? placeholder : displayText}
          fontSize={16}
          color={showPlaceholder ? placeholderColor : textColor}
        />

        {/* Con trỏ nhấp nháy (Vẫn dùng Rect vì là animation primitive riêng) */}
        {isFocused && (
          <Rect
            x={Math.min(cursorX, x + width - 18)}
            y={y + 10}
            width={2} height={height - 20}
            color={color}
            opacity={cursorOpacity}
          />
        )}
      </Group>
    </>
  );
}
```

## Cách dùng (trong CanvasRoot)
```tsx
<CanvasRoot>
  <Input
    x={16} y={124} width={328} height={48}
    value={email} onChange={setEmail}
    placeholder="Nhập email..."
  />
</CanvasRoot>
```

## Links
- Base: [Box.md](./Box.md), [Text.md](./Text.md)
- Function: [measureText.md](../functions/measureText.md)
- Store: [event-store.md](../store-design/event-store.md)
- Integration: [integration.md](../store-design/integration.md)
