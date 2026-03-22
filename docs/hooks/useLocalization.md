# useLocalization & useMediaQuery Hooks

## useLocalization

### Mục đích
- Cung cấp hệ thống đa ngôn ngữ cho UI kit.
- Hàm `t(key)` trả về bản dịch theo locale hiện tại.

### Flutter tương đương
- `Localizations.of(context)`, `AppLocalizations`

### API

```tsx
import { useLocalization } from 'react-native-skia-kit';

function MyScreen() {
  const { t, locale, setLocale, setTranslations } = useLocalization();

  // Setup translations (thường ở root)
  setTranslations({
    vi: { welcome: 'Xin chào', logout: 'Đăng xuất' },
    en: { welcome: 'Hello', logout: 'Logout' },
  });

  // Sử dụng
  <Text text={t('welcome')} />  // "Xin chào"

  // Đổi ngôn ngữ
  setLocale('en');
  // → Text tự re-render → "Hello"
}
```

### Fallback
- Nếu key không tìm thấy trong locale hiện tại → thử `fallbackLocale` (default: `'en'`)
- Nếu vẫn không có → trả về key gốc

---

## useMediaQuery

### Mục đích
- Responsive UI — cung cấp kích thước màn hình và breakpoints.
- Theo Material 3 breakpoints.

### Flutter tương đương
- `MediaQuery.of(context)`, `LayoutBuilder`

### API

```tsx
import { useMediaQuery } from 'react-native-skia-kit';

function MyScreen() {
  const { width, height, breakpoint, isCompact, isMedium, isExpanded, isPortrait } = useMediaQuery();

  const columns = isCompact ? 2 : isMedium ? 3 : 4;

  return (
    <GridView crossAxisCount={columns}>
      ...
    </GridView>
  );
}
```

### Breakpoints (Material 3)

| Breakpoint | Width | Ví dụ |
|-----------|-------|-------|
| `compact` | < 600px | Phone portrait |
| `medium` | 600-839px | Tablet portrait / phone landscape |
| `expanded` | 840-1199px | Tablet landscape |
| `large` | ≥ 1200px | Desktop |

### TypeScript Interface

```ts
interface MediaQueryInfo {
  width: number;
  height: number;
  breakpoint: 'compact' | 'medium' | 'expanded' | 'large';
  isPortrait: boolean;
  isLandscape: boolean;
  isCompact: boolean;
  isMedium: boolean;
  isExpanded: boolean;
}
```

## Nguồn tham khảo
- [Flutter Localizations](https://docs.flutter.dev/ui/accessibility-and-internationalization/internationalization)
- [Material 3 Responsive Layout](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)
