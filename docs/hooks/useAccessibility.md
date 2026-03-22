# useAccessibility Hook & AccessibilityOverlay

## Mục đích
- Hỗ trợ screen reader (TalkBack/VoiceOver) cho Skia canvas.
- Skia render pixel-based → không có native accessibility. Hook này tạo **invisible native views** đè lên canvas để screen reader nhận biết.

## Flutter tương đương
- `Semantics` widget, `semanticsLabel`, `excludeFromSemantics`

## Vấn đề
Skia Canvas vẽ tất cả UI bằng GPU → screen reader KHÔNG thể nhận biết buttons, text, checkboxes...

## Giải pháp
Đặt transparent native `View` **đè lên canvas** tại vị trí tương ứng với mỗi widget. Các `View` này có `accessibilityLabel`, `accessibilityRole` → screen reader đọc được.

```
┌──────────────────────────────┐
│  Canvas (Skia)               │ ← UI hiển thị
│  ┌────────────┐              │
│  │  Button    │              │
│  └────────────┘              │
├──────────────────────────────┤
│  AccessibilityOverlay        │ ← Invisible native views
│  ┌────────────┐              │
│  │ View (a11y)│              │ ← Cùng vị trí, transparent
│  └────────────┘              │
└──────────────────────────────┘
```

## API

### useAccessibility

```tsx
import { useAccessibility } from 'react-native-skia-kit';

function MyButton({ x, y, width, height, onPress }) {
  const widgetId = useWidget({ type: 'Button', layout: { x, y, width, height } });

  useAccessibility(widgetId, {
    accessible: true,
    accessibilityLabel: 'Submit button',
    accessibilityRole: 'button',
    accessibilityHint: 'Double tap to submit',
  }, { x, y, width, height }, onPress);

  return <Box ... />;
}
```

### AccessibilityOverlay

```tsx
import { CanvasRoot, AccessibilityOverlay } from 'react-native-skia-kit';

function App() {
  return (
    <>
      <CanvasRoot>
        {/* All Skia UI */}
      </CanvasRoot>
      <AccessibilityOverlay />  {/* Đặt SAU CanvasRoot */}
    </>
  );
}
```

## TypeScript Interface

```ts
function useAccessibility(
  widgetId: string,
  props: {
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: AccessibilityRole;
    accessibilityHint?: string;
    accessibilityValue?: { min?: number; max?: number; now?: number; text?: string };
  },
  rect: { x: number; y: number; width: number; height: number },
  onPress?: () => void
): void;
```

## Quan hệ với accessibilityStore

- `useAccessibility` gọi `accessibilityStore.registerNode()` khi mount
- `AccessibilityOverlay` đọc `accessibilityStore.getNodes()` để render native views
- Cleanup trên unmount qua `accessibilityStore.unregisterNode()`

## Nguồn tham khảo
- [Flutter Semantics](https://api.flutter.dev/flutter/widgets/Semantics-class.html)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
