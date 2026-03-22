# TabBarView Component

## Mục đích
- Hiển thị các trang swipeable liên kết với TabBar.
- Detect horizontal swipe để đổi tab.

## Flutter tương đương
- `TabBarView`

## TypeScript Interface

```ts
interface TabBarViewProps extends WidgetProps {
  children: React.ReactNode;     // Mỗi child = 1 page
  activeIndex?: number;          // Tab hiện tại (controlled)
  onChanged?: (index: number) => void;  // Callback khi swipe
  swipeThreshold?: number;       // Ngưỡng swipe (default: 60px)
}
```

## Cách sử dụng

```tsx
import { TabBar, TabBarView } from 'react-native-skia-kit';

function App() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: 'Home' },
    { label: 'Search' },
    { label: 'Profile' },
  ];

  return (
    <>
      <TabBar
        items={tabs}
        activeIndex={tab}
        onChanged={setTab}
      />
      <TabBarView
        x={0} y={48} width={360} height={600}
        activeIndex={tab}
        onChanged={setTab}
      >
        <HomeContent />
        <SearchContent />
        <ProfileContent />
      </TabBarView>
    </>
  );
}
```

## Cách hoạt động
1. `React.Children.toArray` — split children thành pages
2. Chỉ render `pages[activeIndex]` (performance)
3. `useHitTest` + `onPanEnd` — detect swipe left/right
4. `Group` + `clip` — viewport clipping

## Nguồn tham khảo
- [Flutter TabBarView](https://api.flutter.dev/flutter/material/TabBarView-class.html)
