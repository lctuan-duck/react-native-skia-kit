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
import type { FlexChildStyle, SpacingStyle } from '../core/style.types';

// ===== ScrollView =====

export type ScrollViewStyle = FlexChildStyle &
  SpacingStyle & {
    width?: number;
    height?: number;
  };

export interface ScrollViewProps extends WidgetProps {
  children: React.ReactNode;
  horizontal?: boolean;
  physics?: 'clamped' | 'bouncing';
  contentSize?: number;
  scrollEnabled?: boolean;
  onScroll?: (offset: number) => void;
  /** Style override */
  style?: ScrollViewStyle;
}

export const ScrollView = React.memo(function ScrollView({
  x = 0,
  y = 0,
  style,
  children,
  horizontal = false,
  physics = 'clamped',
  contentSize,
  scrollEnabled = true,
}: ScrollViewProps) {
  const width = style?.width ?? 360;
  const height = style?.height ?? 600;
  const padding = style?.padding ?? 0;

  let estimatedContentSize: number;
  if (contentSize != null) {
    estimatedContentSize = contentSize;
  } else {
    const { estimateContentSize: estimate } = require('../hooks/useYogaLayout');
    const autoSize = estimate(children, width);
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

  const lastTranslationRef = useRef(0);

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
            style={{
              width: estimatedContentSize,
              height,
              flexDirection: 'row',
              padding,
            }}
          >
            {children}
          </Box>
        ) : (
          <Column
            x={x}
            y={y}
            style={{ width, padding }}
          >
            {children}
          </Column>
        )}
      </Group>
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
  /** Style override */
  style?: FlexChildStyle & SpacingStyle & { width?: number };
}

export const GridView = React.memo(function GridView({
  x = 0,
  y = 0,
  style,
  children,
  crossAxisCount: _crossAxisCount = 2,
  mainAxisSpacing = 8,
  crossAxisSpacing = 8,
}: GridViewProps) {
  const width = style?.width ?? 360;
  const padding = style?.padding ?? 0;
  return (
    <Box
      x={x}
      y={y}
      style={{
        width,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: crossAxisSpacing,
        rowGap: mainAxisSpacing,
        padding,
        ...style,
      }}
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
  swipeThreshold?: number;
  /** Style override */
  style?: FlexChildStyle & { width?: number; height?: number };
}

export const PageView = React.memo(function PageView({
  x = 0,
  y = 0,
  style,
  children,
  activeIndex = 0,
  onPageChanged,
  swipeThreshold = 50,
}: PageViewProps) {
  const pages = React.Children.toArray(children);
  const activePage = pages[activeIndex];
  const pageWidth = style?.width ?? 360;
  const pageHeight = style?.height ?? 600;

  const widgetId = useWidget({
    type: 'PageView',
    layout: { x, y, width: pageWidth, height: pageHeight },
  });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width: pageWidth, height: pageHeight },
    callbacks: {
      onPanEnd: (e: PanEvent) => {
        const tx = e?.translationX ?? 0;
        if (Math.abs(tx) >= swipeThreshold && onPageChanged) {
          if (tx < 0 && activeIndex < pages.length - 1) {
            onPageChanged(activeIndex + 1);
          } else if (tx > 0 && activeIndex > 0) {
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
