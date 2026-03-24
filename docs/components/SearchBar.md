# SearchBar

Thanh tìm kiếm. Tương đương Flutter `SearchBar`.

## Interface

```ts
type SearchBarStyle = ColorStyle & BorderStyle & ShadowStyle & FlexChildStyle & {
  textColor?: string;
  placeholderColor?: string;
  width?: number;
  height?: number;
};

interface SearchBarProps {
  value?: string;
  placeholder?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: SearchBarStyle;
  onChanged?: (text: string) => void;
  onSubmitted?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

## Cách dùng

```tsx
<SearchBar value={query} onChanged={setQuery} placeholder="Search..." />
<SearchBar style={{ width: 320, borderRadius: 24 }} />
```
