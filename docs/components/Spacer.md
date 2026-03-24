# Spacer

Khoảng trống cố định trong layout. Tương đương Flutter `SizedBox` dùng làm spacing.

## Interface

```ts
interface SpacerProps {
  size?: number;              // default: 16
  orientation?: 'vertical' | 'horizontal';
}
```

## Cách dùng

```tsx
<Column>
  <Text text="Above" style={{ fontSize: 16 }} />
  <Spacer size={24} />
  <Text text="Below" style={{ fontSize: 16 }} />
</Column>

<Row>
  <Icon name="home" />
  <Spacer size={12} orientation="horizontal" />
  <Text text="Home" style={{ fontSize: 14 }} />
</Row>
```
