# BottomNavigationBar

Thanh điều hướng dưới cùng. Tương đương Flutter `BottomNavigationBar`.

## Interface

```ts
type BottomNavigationBarStyle = ColorStyle & ShadowStyle & FlexChildStyle & {
  activeColor?: string;
  inactiveColor?: string;
  width?: number;
  height?: number;
};

interface BottomNavItem { icon: string; label: string; activeIcon?: string; }

interface BottomNavigationBarProps {
  items: BottomNavItem[];
  activeIndex?: number;
  style?: BottomNavigationBarStyle;
  onChange?: (index: number) => void;
}
```

> **Gợi ý**: Mọi nút bấm trong BottomNavigationBar đều tích hợp sẵn hiệu ứng tỏa sóng `interactive="ripple"` siêu thanh lịch!

## Cách dùng

```tsx
<BottomNavigationBar
  items={[
    { icon: 'home', label: 'Home' },
    { icon: 'search', label: 'Search' },
    { icon: 'user', label: 'Profile' },
  ]}
  activeIndex={tab}
  onChange={setTab}
/>
```
