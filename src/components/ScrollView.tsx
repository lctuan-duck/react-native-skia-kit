import * as React from 'react';
import { useEffect } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import {
  globalActiveWidgetId,
  globalPanEvent,
  globalPanState,
} from '../core/GlobalEngine';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { Box } from './Box';
import { Column } from './Column';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useScrollPhysics } from '../hooks/useScrollPhysics';
import { useEventStore } from '../stores/eventStore';
import { useLayoutStore } from '../stores/layoutStore';
import { WidgetContext } from '../core/WidgetContext';
import type { WidgetProps, PanEvent } from '../types/widget.types';
import type { FlexChildStyle, SpacingStyle } from '../types/style.types';

// ===== ScrollView =====

export type ScrollViewStyle = FlexChildStyle &
  SpacingStyle & {
    width?: number | string;
    height?: number | string;
    gap?: number;
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
}: ScrollViewProps) {
  const width = style?.width ?? 360;
  const height = style?.height ?? 600;
  const fallbackW = typeof width === 'number' ? width : 360;
  const fallbackH = typeof height === 'number' ? height : 600;
  const padding = style?.padding ?? 0;
  const gap = style?.gap ?? 0;

  const widgetId = useWidget({
    type: 'ScrollView',
    layout: { x, y, width: fallbackW, height: fallbackH },
  });

  const contentContainerId = `${widgetId}-content`;

  const layoutResult = useNativeYogaLayout(widgetId, style, [
    contentContainerId,
  ]);

  const finalX = layoutResult?.x ?? x;
  const finalY = layoutResult?.y ?? y;
  const numWidth = layoutResult?.width ?? fallbackW;
  const numHeight = layoutResult?.height ?? fallbackH;

  const contentLayout = useLayoutStore((s) => s.layoutMap[contentContainerId]);

  let estimatedContentSize: number;
  if (contentSize != null) {
    estimatedContentSize = contentSize;
  } else {
    estimatedContentSize = horizontal
      ? contentLayout?.rect.width ?? numWidth
      : contentLayout?.rect.height ?? numHeight;
  }

  const { scrollOffset, handlePanUpdate, handlePanEnd } = useScrollPhysics(
    physics === 'clamped' ? 'clamping' : 'bouncing',
    {
      viewportSize: horizontal ? numWidth : numHeight,
      contentSize: estimatedContentSize,
    }
  );

  useEffect(() => {
    useEventStore.getState().registerScrollArea(widgetId, {
      rect: { left: finalX, top: finalY, width: numWidth, height: numHeight },
      offset: 0,
      horizontal,
    });
    return () => {
      useEventStore.getState().unregisterScrollArea(widgetId);
    };
  }, [widgetId, finalX, finalY, numWidth, numHeight, horizontal]);

  const lastTranslation = useSharedValue(0);

  // Sync scroll offset to C++ engine

  const updateScrollStore = React.useCallback((id: string, off: number) => {
    useEventStore.getState().updateScrollOffset(id, off);
  }, []);

  useAnimatedReaction(
    () => scrollOffset.value,
    (offset) => {
      'worklet';
      runOnJS(updateScrollStore)(widgetId, offset);
    }
  );

  useAnimatedReaction(
    () => globalActiveWidgetId.value === widgetId,
    (isActive, wasActive) => {
      if (isActive && !wasActive && globalPanEvent.value) {
        lastTranslation.value = horizontal
          ? globalPanEvent.value.translationX
          : globalPanEvent.value.translationY;
      }
    }
  );

  // Read global events natively
  useAnimatedReaction(
    () => globalPanEvent.value,
    (e) => {
      if (
        globalActiveWidgetId.value === widgetId &&
        e &&
        globalPanState.value
      ) {
        if (globalPanState.value === 'start') {
          lastTranslation.value = 0;
        } else if (globalPanState.value === 'update') {
          const currentTranslation = horizontal
            ? e.translationX
            : e.translationY;
          const delta = currentTranslation - lastTranslation.value;
          lastTranslation.value = currentTranslation;
          handlePanUpdate(delta);
        } else if (globalPanState.value === 'end') {
          const velocity = horizontal ? e.velocityX : e.velocityY;
          handlePanEnd(velocity);
          lastTranslation.value = 0;
        }
      }
    }
  );

  const hitCallbacks = React.useMemo(() => ({
    // Add dummy callback so useHitTest actually registers the widget
    onPanStart: () => {},
  }), []);

  React.useEffect(() => {
    console.log(`[ScrollView] ID: ${widgetId}, Layout: ${finalX},${finalY} ${numWidth}x${numHeight}, ContentSize: ${estimatedContentSize}`);
  }, [widgetId, finalX, finalY, numWidth, numHeight, estimatedContentSize]);

  useHitTest(widgetId, {
    rect: { left: finalX, top: finalY, width: numWidth, height: numHeight },
    callbacks: hitCallbacks,
    behavior: 'opaque',
  });

  const transform = useDerivedValue(() =>
    horizontal
      ? [{ translateX: -scrollOffset.value }]
      : [{ translateY: -scrollOffset.value }]
  );

  const indicatorSize = (numHeight * numHeight) / estimatedContentSize;
  const indicatorTransform = useDerivedValue(() => [
    { translateY: scrollOffset.value * (numHeight / estimatedContentSize) },
  ]);



  return (
    <WidgetContext.Provider value={widgetId}>
      <Group
        clip={{ x: finalX, y: finalY, width: numWidth, height: numHeight }}
      >
        <Group transform={transform}>
          {horizontal ? (
            <Box
              id={contentContainerId}
              style={{
                height: numHeight,
                flexDirection: 'row',
                padding,
                gap,
              }}
            >
              {children}
            </Box>
          ) : (
            <Column
              id={contentContainerId}
              style={{
                width: numWidth,
                padding,
                gap,
              }}
            >
              {children}
            </Column>
          )}
        </Group>
        {!horizontal && numHeight < estimatedContentSize && (
          <Group transform={indicatorTransform}>
            <Rect
              x={finalX + numWidth - 3}
              y={finalY}
              width={3}
              height={indicatorSize}
              color="rgba(0,0,0,0.15)"
            />
          </Group>
        )}
      </Group>
    </WidgetContext.Provider>
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
        ...style,
        width,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: crossAxisSpacing,
        rowGap: mainAxisSpacing,
        padding,
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

(ScrollView as any).skiaWidgetType = 'ScrollView';

(GridView as any).skiaWidgetType = 'GridView';

(PageView as any).skiaWidgetType = 'PageView';
