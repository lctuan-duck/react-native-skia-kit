import * as React from 'react';
import { useState, useCallback, useRef } from 'react';
import { useSharedValue, withSpring, withTiming, useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Box } from './Box';
import { Progress } from './Progress';
import { useWidgetId } from '../hooks/useWidgetId';
import { useEngine } from '../core/EngineContext';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';

// === RefreshIndicator Types ===

export type RefreshIndicatorStyle = ColorStyle &
  FlexChildStyle & {
    width?: number;
  };

export interface RefreshIndicatorProps extends WidgetProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  /** Semantic color for the spinner */
  color?: SemanticColor;
  /** How far down the user must pull to trigger refresh (default: 60) */
  displacement?: number;
  /** Screen width for centering indicator */
  screenWidth?: number;
  /** Style override */
  style?: RefreshIndicatorStyle;
}

/**
 * RefreshIndicator — pull-to-refresh container.
 * - Wraps `children` in a pan-gesture-aware container.
 * - When the user pulls down ≥ displacement px, triggers `onRefresh`.
 * - Content slides down via C++ translateY animation during pull.
 * - Shows a circular Progress spinner while refreshing.
 * Equivalent to Flutter RefreshIndicator.
 */
export const RefreshIndicator = React.memo(function RefreshIndicator({
  children,
  onRefresh,
  color = 'primary',
  displacement = 64,
  screenWidth,
  style,
}: RefreshIndicatorProps) {
  const containerWidth = style?.width ?? screenWidth ?? 360;
  const spinnerX =
    (typeof containerWidth === 'number' ? containerWidth : 360) / 2 - 14;

  const [refreshing, setRefreshing] = useState(false);
  const contentId = useWidgetId('RI-content');
  const engine = useEngine();
  const isRefreshingRef = useRef(false);

  // Stable ref cho scheduleOnRN fallback — capture engine per-instance
  const applyPullOffsetRef = useRef((cId: string, ty: number) => {
    engine.updateAnimatedStyles(cId, { translateY: ty });
    (global as any).skiaKitScrollRedraw?.();
  });
  applyPullOffsetRef.current = (cId, ty) => {
    engine.updateAnimatedStyles(cId, { translateY: ty });
    (global as any).skiaKitScrollRedraw?.();
  };


  // Shared value tracks the pull offset (0 = neutral, positive = pulled down)
  const pullOffset = useSharedValue(0);

  // Bridge pullOffset → C++ translateY on the content box
  useAnimatedReaction(
    () => pullOffset.value,
    (ty) => {
      'worklet';
      const direct = (global as any).updateAnimatedStylesDirect;
      if (typeof direct === 'function') {
        direct(contentId, { translateY: ty });
        (global as any).skiaKitScrollRedraw?.();
      } else {
        scheduleOnRN(applyPullOffsetRef.current, contentId, ty);
      }
    },
    [contentId]
  );

  const triggerRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshing(true);
    // Snap content to displacement offset while refreshing
    pullOffset.value = withSpring(displacement, { damping: 20, stiffness: 200 });
    try {
      await onRefresh();
    } finally {
      // Spring back to 0 after refresh completes
      pullOffset.value = withSpring(0, { damping: 25, stiffness: 200 });
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [onRefresh, displacement, pullOffset]);

  // Pull gesture handlers exposed to CanvasRoot reconciler via 'RefreshIndicator' host type.
  // The C++ SkiaKitReconciler calls onPanUpdate/onPanEnd when a downward pan starts at y≈0.
  const onPanUpdate = useCallback(
    (e: { translationY: number }) => {
      if (isRefreshingRef.current) return;
      const pulled = Math.max(0, e.translationY);
      // Rubber-band: full 1:1 up to displacement, then tanh slowdown
      const damped =
        pulled <= displacement
          ? pulled
          : displacement + (displacement * Math.tanh((pulled - displacement) / displacement));
      pullOffset.value = withTiming(damped, { duration: 0 });
    },
    [displacement, pullOffset]
  );

  const onPanEnd = useCallback(
    (e: { translationY: number; velocityY: number }) => {
      if (isRefreshingRef.current) return;
      if (e.translationY >= displacement) {
        // User pulled far enough — trigger refresh
        triggerRefresh();
      } else {
        // Not enough — spring back
        pullOffset.value = withSpring(0, { damping: 25, stiffness: 200 });
      }
    },
    [displacement, pullOffset, triggerRefresh]
  );

  return (
    <Box
      style={{
        width: containerWidth,
        // The Box height auto-sizes to children
        overflow: 'visible',
      }}
      onPanUpdate={onPanUpdate as any}
      onPanEnd={onPanEnd as any}
    >
      {/* Spinner appears above the content (negative top offset = above the viewport) */}
      {(refreshing || pullOffset.value > 8) && (
        <Progress
          variant="circular"
          color={color}
          style={{
            size: 28,
            strokeWidth: 3,
            position: 'absolute',
            left: spinnerX,
            top: 8,
          }}
        />
      )}

      {/* Content slides down via C++ translateY during pull */}
      <Box id={contentId} style={{ width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
});

(RefreshIndicator as any).skiaWidgetType = 'RefreshIndicator';