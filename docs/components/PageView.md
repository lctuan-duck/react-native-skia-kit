# PageView Component

## Mục đích
- Container cuộn ngang theo trang (swipeable pages), snap vào từng trang.
- Dùng cho onboarding, image carousel, tab content.

## Flutter tương đương
- `PageView`, `PageController`

## TypeScript Interface

```ts
interface PageViewProps extends WidgetProps {
  x?: number;
  y?: number;
  width: number;          // REQUIRED — page width
  height: number;         // REQUIRED — page height
  initialPage?: number;   // default: 0
  onPageChanged?: (page: number) => void;
  physics?: 'clamped' | 'bouncing';  // default: 'clamped'
  scrollDirection?: 'horizontal' | 'vertical'; // default: 'horizontal'
  children: React.ReactNode;  // mỗi child = 1 page
}

// Controller để điều khiển từ bên ngoài
interface PageController {
  jumpToPage: (page: number) => void;
  animateToPage: (page: number, duration?: number) => void;
  currentPage: number;
}

function usePageController(initialPage?: number): PageController;
```

## Props Table

| Prop | Type | Default | Required | Mô tả |
|------|------|---------|----------|-------|
| `width` | `number` | — | ✅ | Chiều rộng (= page width) |
| `height` | `number` | — | ✅ | Chiều cao |
| `initialPage` | `number` | `0` | ❌ | Trang bắt đầu |
| `onPageChanged` | `(page) => void` | — | ❌ | Callback đổi trang |
| `physics` | `string` | `'clamped'` | ❌ | Scroll physics |
| `scrollDirection` | `string` | `'horizontal'` | ❌ | Hướng cuộn |

## Core Implementation

```tsx
import React, { useRef, useCallback } from 'react';
import { useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Group } from '@shopify/react-native-skia';
import { useWidget, useHitTest } from 'react-native-skia-kit/hooks';

export const PageView = React.memo(function PageView({
  x = 0, y = 0,
  width, height,
  initialPage = 0,
  onPageChanged,
  physics = 'clamped',
  scrollDirection = 'horizontal',
  children,
}: PageViewProps) {
  const pageCount = React.Children.count(children);
  const currentPage = useSharedValue(initialPage);
  const offset = useSharedValue(-initialPage * width);

  const widgetId = useWidget({
    type: 'PageView',
    layout: { x, y, width, height },
  });

  // Pan gesture: kéo ngang → snap vào trang gần nhất
  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: {
      onPanUpdate: (e) => {
        offset.value += e.deltaX;
      },
      onPanEnd: (e) => {
        // Snap — tìm trang gần nhất
        const targetPage = Math.round(-offset.value / width);
        const clampedPage = Math.max(0, Math.min(pageCount - 1, targetPage));
        offset.value = withSpring(-clampedPage * width);
        currentPage.value = clampedPage;

        if (onPageChanged) {
          runOnJS(onPageChanged)(clampedPage);
        }
      },
    },
    behavior: 'opaque',
  });

  const isHorizontal = scrollDirection === 'horizontal';

  return (
    <Group clip={{ x, y, width, height }}>
      <Group transform={isHorizontal
        ? [{ translateX: offset.value }]
        : [{ translateY: offset.value }]
      }>
        {React.Children.map(children, (child, i) => {
          if (!React.isValidElement(child)) return null;
          const pageX = isHorizontal ? x + i * width : x;
          const pageY = isHorizontal ? y : y + i * height;
          return React.cloneElement(child as React.ReactElement<any>, {
            x: pageX, y: pageY, width, height,
          });
        })}
      </Group>
    </Group>
  );
});
```

## Cách dùng

### Onboarding
```tsx
<PageView x={0} y={0} width={360} height={800} onPageChanged={setPage}>
  <OnboardingPage1 />
  <OnboardingPage2 />
  <OnboardingPage3 />
</PageView>

{/* Page indicator */}
<Row x={0} y={740} width={360} mainAxisAlignment="center" gap={8}>
  {[0, 1, 2].map(i => (
    <Box key={i} width={page === i ? 24 : 8} height={8}
      borderRadius={4} color={page === i ? theme.colors.primary : theme.colors.border} />
  ))}
</Row>
```

### Image carousel
```tsx
<PageView x={16} y={100} width={328} height={200}>
  {banners.map((banner, i) => (
    <Image key={i} src={banner.url} fit="cover" borderRadius={12} />
  ))}
</PageView>
```

### Vertical pages
```tsx
<PageView x={0} y={0} width={360} height={800} scrollDirection="vertical">
  <StoryPage1 />
  <StoryPage2 />
  <StoryPage3 />
</PageView>
```

### Controller
```tsx
const controller = usePageController(0);

<PageView x={0} y={0} width={360} height={600}
  onPageChanged={(p) => console.log('page:', p)}>
  <Page1 />
  <Page2 />
</PageView>

<Button text="Go to page 2" onPress={() => controller.animateToPage(1)} />
```

## Links
- Related: [ScrollView.md](./ScrollView.md), [TabBar.md](./TabBar.md)
- Gesture: [useHitTest.md](../hooks/useHitTest.md)
- Store: [event-store.md](../store-design/event-store.md)
