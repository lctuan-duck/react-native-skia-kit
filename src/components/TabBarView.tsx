import * as React from 'react';
import { useRef } from 'react';
import { Group } from '@shopify/react-native-skia';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import type { WidgetProps, PanEvent } from '../core/types';

export interface TabBarViewProps extends WidgetProps {
  children: React.ReactNode;
  /** Viewport width */
  width?: number;
  /** Viewport height */
  height?: number;
  /** Active tab index (controlled) */
  activeIndex?: number;
  /** Callback when tab changes via swipe */
  onChanged?: (index: number) => void;
  /** Swipe threshold in pixels */
  swipeThreshold?: number;
}

/**
 * TabBarView — swipeable pages linked to TabBar.
 * Detects horizontal swipe to change active tab.
 * Only renders the active page.
 *
 * Equivalent to Flutter TabBarView.
 *
 * @example
 * const [tab, setTab] = useState(0);
 *
 * <TabBar items={tabs} activeIndex={tab} onChanged={setTab} />
 * <TabBarView
 *   x={0} y={48} width={360} height={600}
 *   activeIndex={tab} onChanged={setTab}
 * >
 *   <HomeContent />
 *   <SearchContent />
 *   <ProfileContent />
 * </TabBarView>
 */
export const TabBarView = React.memo(function TabBarView({
  x = 0,
  y = 0,
  width = 360,
  height = 600,
  children,
  activeIndex = 0,
  onChanged,
  swipeThreshold = 60,
}: TabBarViewProps) {
  const pages = React.Children.toArray(children);
  const activePage = pages[activeIndex];

  const widgetId = useWidget({
    type: 'TabBarView',
    layout: { x, y, width, height },
  });

  // Track swipe state
  const swipeStartRef = useRef(0);

  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: {
      onPanStart: (e: PanEvent) => {
        swipeStartRef.current = e.absoluteX;
      },
      onPanEnd: (e: PanEvent) => {
        const tx = e?.translationX ?? 0;
        if (Math.abs(tx) >= swipeThreshold && onChanged) {
          if (tx < 0 && activeIndex < pages.length - 1) {
            // Swipe left → next page
            onChanged(activeIndex + 1);
          } else if (tx > 0 && activeIndex > 0) {
            // Swipe right → previous page
            onChanged(activeIndex - 1);
          }
        }
      },
    },
    behavior: 'opaque',
  });

  return <Group clip={{ x, y, width, height }}>{activePage}</Group>;
});
