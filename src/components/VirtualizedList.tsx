/**
 * VirtualizedList — Viewport-based lazy rendering for large lists.
 * Phase 10: Performance optimization.
 *
 * Only renders items within the viewport + buffer zone.
 * Equivalent to Flutter's ListView.builder / SliverList.
 */

import * as React from 'react';
import { useMemo, useState } from 'react';
import { Box } from './Box';
import { ScrollView } from './ScrollView';
import type { WidgetProps } from '../types/widget.types';
import type {
  LayoutStyle,
  SpacingStyle,
  FlexChildStyle,
} from '../types/style.types';

export interface VirtualizedListProps<T> extends WidgetProps {
  /** Data array */
  data: T[];
  /** Optional layout styles (width, height, flex, etc.) */
  style?: LayoutStyle & SpacingStyle & FlexChildStyle;
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
  style,
  data,
  itemHeight,
  renderItem,
  keyExtractor,
  bufferCount = 5,
  separatorHeight = 0,
}: VirtualizedListProps<T>) {
  const [scrollOffset, setScrollOffset] = useState(0);

  const totalItemHeight = itemHeight + separatorHeight;
  const contentHeight = data.length * totalItemHeight;
  const numHeight = (style?.height as number) || 800; // rough estimate if no style.height

  // Render only visible items
  const visibleStart = Math.max(
    0,
    Math.floor(scrollOffset / totalItemHeight) - bufferCount
  );

  const visibleItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    const end = Math.min(
      data.length - 1,
      visibleStart + Math.ceil(numHeight / totalItemHeight) + bufferCount * 2
    );

    for (let i = visibleStart; i <= end; i++) {
      const item = data[i];
      if (!item) continue;
      const key = keyExtractor ? keyExtractor(item, i) : String(i);
      const itemY = i * totalItemHeight;
      items.push(
        <Box
          key={key}
          style={{
            position: 'absolute',
            top: itemY,
            left: 0,
            right: 0,
            height: itemHeight,
          }}
        >
          {renderItem(item, i)}
        </Box>
      );
    }
    return items;
  }, [
    data,
    totalItemHeight,
    numHeight,
    bufferCount,
    visibleStart,
    keyExtractor,
    renderItem,
    itemHeight,
  ]);

  return (
    <ScrollView
      style={style}
      contentSize={contentHeight}
      onScroll={setScrollOffset}
    >
      <Box style={{ width: '100%', height: contentHeight }}>{visibleItems}</Box>
    </ScrollView>
  );
}) as <T>(props: VirtualizedListProps<T>) => React.ReactElement;

(VirtualizedList as any).skiaWidgetType = 'VirtualizedList';
