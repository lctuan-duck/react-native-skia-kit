# DropdownButton Component

## Mục đích
- Nút mở menu dropdown để chọn 1 giá trị từ danh sách.

## Flutter tương đương
- `DropdownButton`, `DropdownMenuItem`, `PopupMenuButton`

## TypeScript Interface

```ts
interface DropdownItem<T = string> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface DropdownButtonProps<T = string> extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;          // default: 200
  height?: number;         // default: 48
  items: DropdownItem<T>[];
  value?: T;
  placeholder?: string;    // default: 'Chọn...'
  onChanged?: (value: T) => void;
  disabled?: boolean;
  borderColor?: string;    // default: theme.colors.border
  borderRadius?: number;   // default: 8
  dropdownMaxHeight?: number; // default: 240
}
```

## Core Implementation

```tsx
import React, { useState } from 'react';
import { Box, Text, Icon, Row, Expanded, Column, Overlay, ScrollView } from 'react-native-skia-kit';
import { useWidget } from 'react-native-skia-kit/hooks';
import { useTheme } from 'react-native-skia-kit/hooks';

export const DropdownButton = React.memo(function DropdownButton<T extends string>({
  x = 0, y = 0,
  width = 200, height = 48,
  items,
  value,
  placeholder = 'Chọn...',
  onChanged,
  disabled = false,
  borderColor,            // undefined → theme.colors.border
  borderRadius = 8,
  dropdownMaxHeight = 240,
}: DropdownButtonProps<T>) {
  const theme = useTheme();
  const border = borderColor ?? theme.colors.border;
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find(i => i.value === value);

  useWidget({ type: 'DropdownButton', layout: { x, y, width, height } });

  return (
    <>
      {/* Trigger button */}
      <Box x={x} y={y} width={width} height={height}
        borderRadius={borderRadius} borderWidth={1} borderColor={border}
        color={theme.colors.surface} hitTestBehavior="opaque"
        onPress={() => !disabled && setIsOpen(!isOpen)}
        flexDirection="row" alignItems="center" padding={[0, 12, 0, 12]}
        opacity={disabled ? 0.5 : 1}
      >
        <Expanded>
          <Text
            text={selectedItem?.label ?? placeholder}
            fontSize={14}
            color={selectedItem ? theme.colors.textBody : theme.colors.textDisabled}
          />
        </Expanded>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textSecondary} />
      </Box>

      {/* Dropdown menu overlay */}
      {isOpen && (
        <>
          <Overlay visible onPress={() => setIsOpen(false)} />
          <Box
            x={x} y={y + height + 4}
            width={width}
            height={Math.min(items.length * 44, dropdownMaxHeight)}
            color={theme.colors.surface} borderRadius={borderRadius}
            elevation={8} borderWidth={1} borderColor={theme.colors.divider}
          >
            <ScrollView width={width} height={Math.min(items.length * 44, dropdownMaxHeight)}>
              <Column>
                {items.map((item) => (
                  <Box key={String(item.value)}
                    width={width} height={44}
                    color={item.value === value ? theme.colors.surfaceVariant : 'transparent'}
                    hitTestBehavior="opaque"
                    onPress={() => {
                      if (!item.disabled) {
                        onChanged?.(item.value);
                        setIsOpen(false);
                      }
                    }}
                    flexDirection="row" alignItems="center" padding={[0, 12, 0, 12]}
                    gap={8} opacity={item.disabled ? 0.4 : 1}
                  >
                    {item.icon && <Icon name={item.icon} size={20} color={theme.colors.textSecondary} />}
                    <Text text={item.label} fontSize={14}
                      color={item.value === value ? theme.colors.primary : theme.colors.textBody}
                      fontWeight={item.value === value ? 'bold' : 'normal'}
                    />
                  </Box>
                ))}
              </Column>
            </ScrollView>
          </Box>
        </>
      )}
    </>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
const [selected, setSelected] = useState('vn');

<DropdownButton
  width={200}
  items={[
    { value: 'vn', label: 'Việt Nam' },
    { value: 'us', label: 'United States' },
    { value: 'jp', label: 'Japan' },
    { value: 'kr', label: 'Korea' },
  ]}
  value={selected}
  onChanged={setSelected}
/>
```

### Với icon
```tsx
<DropdownButton
  width={250}
  placeholder="Chọn ngôn ngữ"
  items={[
    { value: 'vi', label: 'Tiếng Việt', icon: 'flag-vn' },
    { value: 'en', label: 'English', icon: 'flag-us' },
    { value: 'ja', label: '日本語', icon: 'flag-jp' },
  ]}
  value={lang}
  onChanged={setLang}
/>
```

### Trong FormField
```tsx
<FormField name="country" label="Quốc gia" required>
  <DropdownButton
    width={328}
    items={countries}
    placeholder="Chọn quốc gia"
  />
</FormField>
```

## Links
- Base: [Box.md](./Box.md), [Overlay.md](./Overlay.md)
- Related: [Form.md](./Form.md), [Input.md](./Input.md)
