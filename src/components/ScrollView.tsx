import * as React from 'react';
import { useRef, useEffect } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { Box } from './Box';
import { Column } from './Column';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useScrollPhysics } from '../hooks/useScrollPhysics';
import { useEventStore } from '../stores/eventStore';
import type { WidgetProps, PanEvent } from '../core/types';

// ===== ScrollView =====

export interface ScrollViewProps extends WidgetProps {
  children: React.ReactNode;
  /** Use horizontal scrolling (default: false → vertical) */
  horizontal?: boolean;
  /** Scroll physics: clamped (Android) or bouncing (iOS) */
  physics?: 'clamped' | 'bouncing';
  /** Estimated content size for physics calculation */
  contentSize?: number;
  /** Scroll enabled */
  scrollEnabled?: boolean;
  /** Callback on scroll offset change */
  onScroll?: (offset: number) => void;
  padding?: number | [number, number, number, number];
}

/**
 * ScrollView — scrollable area with physics.
 * Uses useScrollPhysics + Group clip + Group transform for actual scrolling.
 * Tương đương Flutter SingleChildScrollView / ListView.
 */
export const ScrollView = React.memo(function ScrollView({
  x = 0,
  y = 0,
  width = 360,
  height = 600,
  children,
  horizontal = false,
  physics = 'clamped',
  contentSize,
  scrollEnabled = true,
  padding = 0,
}: ScrollViewProps) {
  // Auto-calculate contentSize from children if not specified
  let estimatedContentSize: number;
  if (contentSize != null) {
    estimatedContentSize = contentSize;
  } else {
    // Estimate from children's sizes
    const { estimateContentSize: estimate } = require('../hooks/useYogaLayout');
    const autoSize = estimate(children, width);
    // Ensure contentSize >= viewport so physics work correctly
    estimatedContentSize = Math.max(autoSize, horizontal ? width : height);
  }

  const { scrollOffset, handlePanUpdate, handlePanEnd } = useScrollPhysics(
    physics === 'clamped' ? 'clamping' : 'bouncing',
    {
      viewportSize: horizontal ? width : height,
      contentSize: estimatedContentSize,
    }
  );

  const widgetId = useWidget({
    type: 'ScrollView',
    layout: { x, y, width, height },
  });

  // Register scroll area in eventStore for hit test coordinate adjustment
  useEffect(() => {
    useEventStore.getState().registerScrollArea(widgetId, {
      rect: { left: x, top: y, width, height },
      offset: 0,
      horizontal,
    });
    return () => {
      useEventStore.getState().unregisterScrollArea(widgetId);
    };
  }, [widgetId, x, y, width, height, horizontal]);

  // Track previous translation for delta calculation
  const lastTranslationRef = useRef(0);

  // Register pan gesture for scrolling
  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: {
      onPanStart: scrollEnabled
        ? () => {
            lastTranslationRef.current = 0;
          }
        : undefined,
      onPanUpdate: scrollEnabled
        ? (e: PanEvent) => {
            const currentTranslation = horizontal
              ? e?.translationX ?? 0
              : e?.translationY ?? 0;
            const delta = currentTranslation - lastTranslationRef.current;
            lastTranslationRef.current = currentTranslation;
            handlePanUpdate(delta);
            // Update scroll offset in eventStore for hit test
            useEventStore
              .getState()
              .updateScrollOffset(widgetId, scrollOffset.value);
          }
        : undefined,
      onPanEnd: scrollEnabled
        ? (e: PanEvent) => {
            const velocity = horizontal ? e?.velocityX ?? 0 : e?.velocityY ?? 0;
            handlePanEnd(velocity);
            lastTranslationRef.current = 0;
          }
        : undefined,
    },
    behavior: 'translucent',
  });

  const transform = useDerivedValue(() =>
    horizontal
      ? [{ translateX: -scrollOffset.value }]
      : [{ translateY: -scrollOffset.value }]
  );

  // Scroll indicator position follows scroll offset
  const indicatorSize = (height * height) / estimatedContentSize;
  const indicatorTransform = useDerivedValue(() => [
    { translateY: scrollOffset.value * (height / estimatedContentSize) },
  ]);

  return (
    <Group clip={{ x, y, width, height }}>
      <Group transform={transform}>
        {horizontal ? (
          <Box
            x={x}
            y={y}
            width={estimatedContentSize}
            height={height}
            flexDirection="row"
            padding={padding}
          >
            {children}
          </Box>
        ) : (
          <Column x={x} y={y} width={width} padding={padding}>
            {children}
          </Column>
        )}
      </Group>
      {/* Scroll indicator — tracks scroll position */}
      {!horizontal && height < estimatedContentSize && (
        <Group transform={indicatorTransform}>
          <Rect
            x={x + width - 3}
            y={y}
            width={3}
            height={indicatorSize}
            color="rgba(0,0,0,0.15)"
          />
        </Group>
      )}
    </Group>
  );
});

// ===== GridView =====

export interface GridViewProps extends WidgetProps {
  children: React.ReactNode;
  crossAxisCount?: number;
  mainAxisSpacing?: number;
  crossAxisSpacing?: number;
  padding?: number | [number, number, number, number];
}

/**
 * GridView — grid layout with flexWrap.
 * Tương đương Flutter GridView.
 */
export const GridView = React.memo(function GridView({
  x = 0,
  y = 0,
  width = 360,
  children,
  crossAxisCount: _crossAxisCount = 2,
  mainAxisSpacing = 8,
  crossAxisSpacing = 8,
  padding = 0,
}: GridViewProps) {
  return (
    <Box
      x={x}
      y={y}
      width={width}
      flexDirection="row"
      flexWrap="wrap"
      gap={crossAxisSpacing}
      rowGap={mainAxisSpacing}
      padding={padding}
    >
      {children}
    </Box>
  );
});

// ===== PageView =====

export interface PageViewProps extends WidgetProps {
  children: React.ReactNode;
  activeIndex?: number;
  onPageChanged?: (index: number) => void;
  /** Swipe threshold in pixels (default: 50) */
  swipeThreshold?: number;
}

/**
 * PageView — swipeable pages (renders active page only).
 * Detects horizontal swipe to change pages.
 * Tương đương Flutter PageView.
 */
export const PageView = React.memo(function PageView({
  x = 0,
  y = 0,
  width,
  height,
  children,
  activeIndex = 0,
  onPageChanged,
  swipeThreshold = 50,
}: PageViewProps) {
  const pages = React.Children.toArray(children);
  const activePage = pages[activeIndex];
  const pageWidth = width ?? 360;
  const pageHeight = height ?? 600;

  const widgetId = useWidget({
    type: 'PageView',
    layout: { x, y, width: pageWidth, height: pageHeight },
  });

  // Register swipe gesture for page switching
  useHitTest(widgetId, {
    rect: { left: x, top: y, width: pageWidth, height: pageHeight },
    callbacks: {
      onPanEnd: (e: PanEvent) => {
        const tx = e?.translationX ?? 0;
        if (Math.abs(tx) >= swipeThreshold && onPageChanged) {
          if (tx < 0 && activeIndex < pages.length - 1) {
            // Swipe left → next page
            onPageChanged(activeIndex + 1);
          } else if (tx > 0 && activeIndex > 0) {
            // Swipe right → previous page
            onPageChanged(activeIndex - 1);
          }
        }
      },
    },
    behavior: 'opaque',
  });

  return (
    <Group clip={{ x, y, width: pageWidth, height: pageHeight }}>
      {activePage}
    </Group>
  );
});
