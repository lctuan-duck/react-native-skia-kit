# Avatar

Hình đại diện tròn/vuông. Tương đương Flutter `CircleAvatar`.

## Interface

```ts
type AvatarVariant = 'circle' | 'rounded' | 'square';

type AvatarStyle = ColorStyle & BorderStyle & FlexChildStyle;

interface AvatarProps {
  src?: string;
  variant?: AvatarVariant;     // default: 'circle'
  status?: 'online' | 'offline' | 'busy' | 'away';
  color?: SemanticColor;       // default: 'primary' (fallback bg)
  size?: number;               // default: 48
  style?: AvatarStyle;
  interactive?: 'ripple' | 'bounce' | 'opacity' | 'none'; // Default: 'opacity' if onPress is set
  onPress?: (localX?: number, localY?: number) => void;
}
```

## Cách dùng

```tsx
<Avatar src="https://example.com/photo.jpg" size={56} />
<Avatar color="info" size={40} />  {/* fallback circle with initial */}
<Avatar src={url} variant="rounded" status="online" />
<Avatar variant="square" size={64} style={{ borderWidth: 2, borderColor: '#fff' }} />
```
