# SafeArea

Tránh system UI (notch, status bar, home indicator). Tương đương Flutter `SafeArea`.

## Interface

```ts
type SafeAreaStyle = LayoutStyle & SpacingStyle & ColorStyle & FlexChildStyle
  & Pick<FlexContainerStyle, 'flexDirection' | 'justifyContent' | 'alignItems' | 'gap'>;

interface SafeAreaProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  insets?: { top?: number; bottom?: number; left?: number; right?: number; };
  style?: SafeAreaStyle;
}
```

## Cách dùng

```tsx
<SafeArea style={{ width: 360, height: 800, flexDirection: 'column' }}>
  <Text text="Below status bar" style={{ fontSize: 16 }} />
</SafeArea>

// Custom insets
<SafeArea edges={['top']} insets={{ top: 60 }} style={{ width: 360, height: 800 }}>
  ...
</SafeArea>
```
