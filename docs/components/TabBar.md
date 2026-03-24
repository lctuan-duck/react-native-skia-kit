# TabBar / TabBarView

Tab navigation (tab mode hoặc segment mode). Tương đương Flutter `TabBar` + `TabBarView`.

## TabBar Interface

```ts
type TabBarVariant = 'tab' | 'segment';

type TabBarStyle = ColorStyle & BorderStyle & FlexChildStyle & {
  activeColor?: string;
  inactiveColor?: string;
  indicatorColor?: string;
  width?: number;
  height?: number;
};

interface TabItem { label: string; icon?: string; disabled?: boolean; }

interface TabBarProps {
  items: TabItem[];
  activeIndex?: number;
  onChanged?: (index: number) => void;
  variant?: TabBarVariant;      // default: 'tab'
  style?: TabBarStyle;
}
```

## TabBarView Interface

```ts
interface TabBarViewProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  activeIndex?: number;
  onChanged?: (index: number) => void;
  swipeThreshold?: number;
}
```

## Cách dùng

```tsx
const [tab, setTab] = useState(0);

<TabBar
  items={[{ label: 'Posts' }, { label: 'Media' }, { label: 'Likes' }]}
  activeIndex={tab}
  onChanged={setTab}
/>
<TabBarView activeIndex={tab} onChanged={setTab} width={360} height={600}>
  <PostsContent />
  <MediaContent />
  <LikesContent />
</TabBarView>

// Segment variant
<TabBar
  variant="segment"
  items={[{ label: 'Day' }, { label: 'Week' }, { label: 'Month' }]}
  activeIndex={tab}
  onChanged={setTab}
/>
```
