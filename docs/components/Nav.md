# Nav

Navigation container với transition animation. Tương đương Flutter `Navigator`.

## Interface

```ts
type TransitionType = 'slide' | 'fade' | 'none';

interface NavProps {
  initial: string;
  children: React.ReactNode;
  width?: number;                // viewport width
  height?: number;               // viewport height
  transition?: TransitionType;   // default: 'slide'
  transitionDuration?: number;   // default: 300ms
  onNavigate?: (screenName: string) => void;
}

interface ScreenProps { name: string; path?: string; children?: React.ReactNode; }
```

## Cách dùng

```tsx
<Nav initial="home" width={360} height={800}>
  <Screen name="home"><HomeScreen /></Screen>
  <Screen name="profile"><ProfileScreen /></Screen>
</Nav>
```

Navigation: dùng `useNav()` hook → `push('profile')`, `pop()`, `replace('home')`.
