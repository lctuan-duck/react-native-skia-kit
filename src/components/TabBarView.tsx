import * as React from 'react';
import { useRef } from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import type { WidgetProps, PanEvent } from '../types/widget.types';
import type { LayoutStyle } from '../types/style.types';

export interface TabBarViewProps extends WidgetProps {
  children: React.ReactNode;
  activeIndex?: number;
  onChanged?: (index: number) => void;
  /** Minimum translation X to trigger swipe (default: 60) */
  swipeThreshold?: number;
  /** Width override */
  width?: number;
  /** Height override */
  height?: number;
  /** Style override */
  style?: LayoutStyle;
}

/**
 * TabBarView — horizontally swipable page container.
 * Equivalent to Flutter TabBarView.
 */
export const TabBarView = React.memo(function TabBarView({
  width = 360,
  height = 600,
  children,
  activeIndex = 0,
  onChanged,
  swipeThreshold = 60,
  style,
}: TabBarViewProps) {
  const pages = React.Children.toArray(children);
  const activePage = pages[activeIndex];

  const widgetId = useWidgetId('TabBarView');

  // Track swipe state
  const swipeStartRef = useRef(0);

  return (
    <Box
      id={widgetId}
      style={{
        ...style,
        width,
        height,
        overflow: 'hidden',
      }}
      hitTestBehavior="opaque"
      onPanStart={(e: PanEvent) => {
        swipeStartRef.current = e.absoluteX;
      }}
      onPanEnd={(e: PanEvent) => {
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
      }}
    >
      {activePage}
    </Box>
  );
});

(TabBarView as any).skiaWidgetType = 'TabBarView';
