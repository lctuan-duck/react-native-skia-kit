# CanvasRoot

Root component chứa Skia Canvas + các global providers. Phải wrap toàn bộ app.

## Interface

```ts
interface CanvasRootProps {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark' | ThemeData;
  children: React.ReactNode;
}
```

## Cách dùng

```tsx
<CanvasRoot width={360} height={800} theme="dark">
  <Scaffold
    appBar={<AppBar title="My App" />}
    body={<HomeScreen />}
  />
</CanvasRoot>
```
