# Icon

SVG path-based icon. Tương đương Flutter `Icon`.

## Interface

```ts
interface IconProps {
  name: string;                  // Tên icon từ built-in map — BẮT BUỘC
  size?: number;                 // default: 24
  color?: string;                // default: theme.colors.textBody (nhận hex, không phải SemanticColor)
  opacity?: number;              // 0–1
  onPress?: () => void;
}
```

> **Lưu ý**: Icon là low-level component — `color` nhận raw string (hex/rgb) vì các parent component (Button, TabBar...) truyền resolved hex value xuống.

## Available Icons

`star`, `arrow-right`, `arrow-left`, `chevron-down`, `chevron-up`, `user`, `close`, `check`, `info`, `search`, `home`, `bell`, `plus`, `more`, `edit`, `trash`, `share`, `lock`, `menu`, `mail`, `send`, `heart`, `cog`, `message`, `users`

## Cách dùng

```tsx
<Icon name="home" size={24} />
<Icon name="heart" color="#ff0000" size={32} />
<Icon name="search" onPress={handleSearch} />
```

Lấy danh sách icon: `getIconNames()`.
