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
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import type { WidgetProps } from '../types/widget.types';

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

  // Render only visible items — recomputed when scroll changes
  const [visibleStart, setVisibleStart] = React.useState(0);

  useAnimatedReaction(
    () => scrollOffset.value,
    (offset) => {
      'worklet';
      const start = Math.max(0, Math.floor(offset / totalItemHeight) - bufferCount);
      runOnJS(setVisibleStart)(start);
    },
    [totalItemHeight, bufferCount]
  );

  const visibleItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    const end = Math.min(
      data.length - 1,
      visibleStart + Math.ceil(height / totalItemHeight) + bufferCount * 2
    );

    for (let i = visibleStart; i <= end; i++) {
      const item = data[i];
      if (!item) continue;
      const key = keyExtractor ? keyExtractor(item, i) : String(i);
      const itemY = y + i * totalItemHeight;
      items.push(<Group key={key} transform={[{ translateY: itemY }]}>{renderItem(item, i)}</Group>);
    }
    return items;
  }, [data, totalItemHeight, height, bufferCount, visibleStart, keyExtractor, renderItem, y]);

  const scrollTransform = useDerivedValue(() => [
    { translateY: -scrollOffset.value },
  ]);

  return (
    <Group clip={{ x, y, width, height }}>
      <Group transform={scrollTransform}>{visibleItems}</Group>
    </Group>
  );
}) as <T>(props: VirtualizedListProps<T>) => React.ReactElement;

(VirtualizedList as any).skiaWidgetType = 'VirtualizedList';
