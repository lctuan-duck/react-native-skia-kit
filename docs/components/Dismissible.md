# Dismissible

Vuốt để dismiss. Tương đương Flutter `Dismissible`.

## Interface

```ts
interface DismissibleProps {
  children: React.ReactNode;
  width?: number; height?: number;
  onDismiss: () => void;
  direction?: 'horizontal' | 'vertical';
  threshold?: number;            // default: 100px
}
```

## Cách dùng

```tsx
<Dismissible width={360} height={56} onDismiss={() => deleteItem(id)}>
  <ListTile title="Swipe to delete" />
</Dismissible>
```
