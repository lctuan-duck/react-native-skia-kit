/**
 * VirtualizedList — Viewport-based lazy rendering for large lists.
 * Phase 10: Performance optimization.
 *
 * Only renders items within the viewport + buffer zone.
 * Equivalent to Flutter's ListView.builder / SliverList.
 */

import * as React from 'react';
import { useMemo } from 'react';
import { Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withDecay,
} from 'react-native-reanimated';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import type { WidgetProps } from '../core/types';

export interface VirtualizedListProps<T> extends WidgetProps {
  /** Data array */
  data: T[];
  /** Width of viewport */
  width?: number;
  /** Height of viewport */
  height?: number;
  /** Fixed item height (required for virtualization) */
  itemHeight: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key extractor */
  keyExtractor?: (item: T, index: number) => string;
  /** Number of items to render outside viewport (default: 5) */
  bufferCount?: number;
  /** Separator height (default: 0) */
  separatorHeight?: number;
}

export const VirtualizedList = React.memo(function VirtualizedList<T>({
  x = 0,
  y = 0,
  width = 360,
  height = 400,
  data,
  itemHeight,
  renderItem,
  keyExtractor,
  bufferCount = 5,
  separatorHeight = 0,
}: VirtualizedListProps<T>) {
  const scrollOffset = useSharedValue(0);
  const totalItemHeight = itemHeight + separatorHeight;
  const contentHeight = data.length * totalItemHeight;
  const maxScroll = Math.max(0, contentHeight - height);

  const widgetId = useWidget({
    type: 'VirtualizedList',
    layout: { x, y, width, height },
  });

  // Pan gesture for scrolling
  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: {
      onPanUpdate: (e) => {
        const newOffset = scrollOffset.value - e.translationY;
        scrollOffset.value = Math.max(0, Math.min(maxScroll, newOffset));
      },
      onPanEnd: (e) => {
        // Momentum scrolling with decay
        scrollOffset.value = withDecay({
          velocity: -e.velocityY,
          clamp: [0, maxScroll],
        });
      },
    },
    behavior: 'opaque',
  });

  // Render only visible items
  const visibleItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    const start = Math.max(0, Math.floor(0 / totalItemHeight) - bufferCount);
    const end = Math.min(
      data.length - 1,
      Math.ceil(height / totalItemHeight) + bufferCount
    );

    for (let i = start; i <= end; i++) {
      const item = data[i];
      if (!item) continue;
      const key = keyExtractor ? keyExtractor(item, i) : String(i);

      items.push(<Group key={key}>{renderItem(item, i)}</Group>);
    }
    return items;
  }, [data, totalItemHeight, height, bufferCount, keyExtractor, renderItem]);

  const scrollTransform = useDerivedValue(() => [
    { translateY: -scrollOffset.value },
  ]);

  return (
    <Group clip={{ x, y, width, height }}>
      <Group transform={scrollTransform}>{visibleItems}</Group>
    </Group>
  );
}) as <T>(props: VirtualizedListProps<T>) => React.ReactElement;
