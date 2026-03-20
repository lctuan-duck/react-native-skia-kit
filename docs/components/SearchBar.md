# SearchBar Component

## Mục đích
- Thanh tìm kiếm — input field với icon search, clear button, và optional suggestions.
- Có thể dùng standalone hoặc gắn vào AppBar.

## Flutter tương đương
- `SearchBar`, `SearchDelegate`, `SearchAnchor`

## TypeScript Interface

```ts
interface SearchBarProps extends WidgetProps {
  x?: number;
  y?: number;
  width?: number;            // default: 360
  height?: number;           // default: 48

  // Content
  value?: string;
  placeholder?: string;     // default: 'Tìm kiếm...'
  leading?: React.ReactNode; // default: Search icon
  trailing?: React.ReactNode; // default: Clear button (khi có text)

  // Appearance
  backgroundColor?: string;  // default: theme.colors.surfaceVariant
  textColor?: string;        // default: theme.colors.textBody
  placeholderColor?: string;  // default: theme.colors.textSecondary
  borderRadius?: number;     // default: 24
  elevation?: number;        // default: 0

  // Events
  onChanged?: (text: string) => void;
  onSubmitted?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `value` | `string` | — | ❌ | Controlled text |
| `placeholder` | `string` | `'Tìm kiếm...'` | ❌ | Placeholder |
| `backgroundColor` | `string` | `theme.surfaceVariant` | ❌ | Nền |
| `borderRadius` | `number` | `24` | ❌ | Bo góc (pill shape) |
| `onChanged` | `(text) => void` | — | ❌ | Text thay đổi |
| `onSubmitted` | `(text) => void` | — | ❌ | Submit |

## Core Implementation

```tsx
import React, { useState } from 'react';
import { Box, Text, Icon, Row, Expanded, Input } from 'react-native-skia-kit';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';

export const SearchBar = React.memo(function SearchBar({
  x = 0, y = 0,
  width = 360, height = 48,
  value: controlledValue,
  placeholder = 'Tìm kiếm...',
  leading,
  trailing,
  backgroundColor,
  textColor,
  placeholderColor,
  borderRadius = 24,
  elevation = 0,
  onChanged,
  onSubmitted,
  onFocus,
  onBlur,
}: SearchBarProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.surfaceVariant;
  const fgColor = textColor ?? theme.colors.textBody;
  const phColor = placeholderColor ?? theme.colors.textSecondary;
  const [internalValue, setInternalValue] = useState('');
  const text = controlledValue ?? internalValue;

  useWidget({
    type: 'SearchBar',
    layout: { x, y, width, height },
  });

  const handleChange = (newText: string) => {
    setInternalValue(newText);
    onChanged?.(newText);
  };

  const handleClear = () => {
    setInternalValue('');
    onChanged?.('');
  };

  return (
    <Box
      x={x} y={y} width={width} height={height}
      color={bgColor} borderRadius={borderRadius} elevation={elevation}
      flexDirection="row" alignItems="center"
      padding={[0, 16, 0, 16]} gap={12}
    >
      {/* Leading — Search icon */}
      {leading ?? <Icon name="search" size={20} color={phColor} />}

      {/* Input */}
      <Expanded>
        <Input
          value={text}
          placeholder={placeholder}
          color={fgColor}
          onChange={handleChange}
          onSubmitEditing={() => onSubmitted?.(text)}
          onFocus={onFocus}
          onBlur={onBlur}
          variant="filled"
        />
      </Expanded>

      {/* Trailing — Clear button */}
      {text.length > 0 && (trailing ?? (
        <Icon name="close" size={20} color={phColor} onPress={handleClear} />
      ))}
    </Box>
  );
});
```

## Cách dùng

### Cơ bản
```tsx
<SearchBar onChanged={setQuery} onSubmitted={search} />
```

### Trong AppBar
```tsx
<AppBar
  titleWidget={
    <SearchBar
      width={280} height={40}
      placeholder="Tìm sản phẩm..."
      onChanged={setQuery}
    />
  }
/>
```

### Controlled với suggestions
```tsx
const [query, setQuery] = useState('');
const suggestions = items.filter(i => i.name.includes(query));

<Column gap={0}>
  <SearchBar value={query} onChanged={setQuery} />
  {query.length > 0 && suggestions.map(item => (
    <ListTile
      key={item.id}
      title={item.name}
      onPress={() => selectItem(item)}
    />
  ))}
</Column>
```

## Links
- Base: [Box.md](./Box.md), [Input.md](./Input.md), [Icon.md](./Icon.md)
- Related: [AppBar.md](./AppBar.md), [ListTile.md](./ListTile.md)
