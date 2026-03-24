# Card

Container có style sẵn cho nội dung card. Tương đương Flutter `Card`.

## Interface

```ts
type CardVariant = 'solid' | 'outline' | 'ghost';

type CardStyle = ColorStyle & BorderStyle & ShadowStyle & SpacingStyle & FlexChildStyle & {
  width?: number;
  height?: number;
};

interface CardProps {
  variant?: CardVariant;       // default: 'solid'
  color?: SemanticColor;       // default: 'primary'
  onPress?: () => void;
  onLongPress?: () => void;
  style?: CardStyle;
  children?: React.ReactNode;
}
```

## Cách dùng

```tsx
// Solid card (mặc định)
<Card style={{ width: 300, padding: 16 }}>
  <Text text="Card title" style={{ fontSize: 18, fontWeight: 'bold' }} />
  <Text text="Card content" style={{ fontSize: 14 }} />
</Card>

// Outline card
<Card variant="outline" color="info" style={{ width: 300, padding: 16 }}>
  <Text text="Info card" style={{ fontSize: 14 }} />
</Card>

// Ghost card
<Card variant="ghost" color="success">
  <Text text="Subtle card" style={{ fontSize: 14 }} />
</Card>
```
