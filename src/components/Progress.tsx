import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import { resolveSemanticColor } from '../utils/color';
import { useEngine } from '../core/EngineContext';
import {
  useSharedValue,
  withTiming,
  withRepeat,
  cancelAnimation,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// === Progress Types ===

export type ProgressVariant = 'linear' | 'circular';

export type ProgressStyle = ColorStyle &
  FlexChildStyle & {
    trackColor?: string;
    strokeWidth?: number;
    size?: number;
    width?: number;
    height?: number;
  };

export interface ProgressProps extends WidgetProps {
  /** Variant (default: linear) */
  variant?: ProgressVariant;
  /** 0..1, undefined = indeterminate */
  value?: number;
  /** Colors */
  color?: SemanticColor | string;
  /** Style override */
  style?: ProgressStyle;
}

const updateProgressUI = (
  fillId: string,
  isDeterminate: boolean,
  p: number,
  finalWidth: number,
  variant: 'linear' | 'circular'
) => {
    if (variant === 'circular') {
    // rotateZ đã dùng updateAnimatedStyles (bypass Yoga) ✅
    engine.updateAnimatedStyles(fillId, { rotateZ: p * 360 });
  } else {
    if (isDeterminate) {
      // updateAnimatedStyles → set _animWidth trực tiếp, bypass Yoga recalc
      engine.updateAnimatedStyles(fillId, { width: p * finalWidth });
    } else {
      // Indeterminate: use translateX to avoid Yoga layout thrashing
      const fillW = finalWidth * 0.4;
      const maxLeft = finalWidth - fillW;
      engine.updateAnimatedStyles(fillId, {
        translateX: p * maxLeft,
      });
    }
  }
  (global as any).skiaKitScrollRedraw?.();
};

/**
 * Progress — linear bar or circular spinner.
 * Equivalent to Flutter LinearProgressIndicator / CircularProgressIndicator.
 */
export const Progress = React.memo(function Progress({
  variant = 'linear',
  value,
  color,
  style,
}: ProgressProps) {
  const theme = useTheme();
  const engine = useEngine();

  const resolvedColor = resolveSemanticColor(
    (color as SemanticColor) || 'primary',
    theme.colors
  );

  const trackBg = style?.trackColor ?? theme.colors.surfaceVariant;
  const isDeterminate = value != null;

  const width = style?.width ?? 200;
  const height = style?.height ?? 4;
  const size = style?.size ?? 48;
  const strokeW = style?.strokeWidth ?? 4;

  const widgetId = useWidgetId('Progress');
  const fillId = useWidgetId('ProgressFill');
  const layout = useNativeYogaLayout(widgetId, {
    width: variant === 'linear' ? width : size,
    height: variant === 'linear' ? height : size,
  });

  const finalWidth =
    layout?.width > 0 ? layout.width : typeof width === 'number' ? width : 200;

  const safeValue = isDeterminate ? Math.max(0, Math.min(1, value)) : 0;
  const progress = useSharedValue(safeValue);
  const indetProgress = useSharedValue(0);
  const updateCounter = useSharedValue(0);

  React.useEffect(() => {
    if (isDeterminate) {
      progress.value = withTiming(safeValue, { duration: 250 });
    } else {
      // Indeterminate animation — repeats infinitely
      indetProgress.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1, // infinite
        false
      );
    }
    // P2 fix: cancel animation on unmount or when switching determinate↔indeterminate.
    // Prevents ghost scheduleOnRN calls after the C++ fillId node is cleaned up.
    return () => {
      cancelAnimation(progress);
      cancelAnimation(indetProgress);
    };
  }, [isDeterminate, safeValue, progress, indetProgress]);

  useAnimatedReaction(
    () => (isDeterminate ? progress.value : indetProgress.value),
    (p) => {
      'worklet';
      const direct = (global as any).updateAnimatedStylesDirect;
      if (typeof direct === 'function') {
        // Direct worklet → C++ path — no JS thread hop (critical for withRepeat @ 60fps)
        if (variant === 'circular') {
          direct(fillId, { rotateZ: p * 360 });
        } else if (isDeterminate) {
          direct(fillId, { width: p * finalWidth });
        } else {
          const fillW = finalWidth * 0.4;
          const maxLeft = finalWidth - fillW;
          direct(fillId, { translateX: p * maxLeft });
        }
        (global as any).skiaKitScrollRedraw?.();
      } else {
        // Fallback: throttle to ~15fps to avoid JS thread flooding
        updateCounter.value += 1;
        if (updateCounter.value % 4 === 0) {
          scheduleOnRN(
            updateProgressUI,
            fillId,
            isDeterminate,
            p,
            finalWidth,
            variant
          );
        }
      }
    },
    [isDeterminate, finalWidth, fillId, variant]
  );

  React.useLayoutEffect(() => {
    updateProgressUI(fillId, isDeterminate, safeValue, finalWidth, variant);
  }, [fillId, isDeterminate, safeValue, finalWidth, variant]);

  if (variant === 'linear') {
    return (
      <Box
        id={widgetId}
        style={{
          width,
          height,
          backgroundColor: trackBg,
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <Box
          id={fillId}
          style={{
            width: isDeterminate ? undefined : '40%',
            height: '100%',
            backgroundColor: resolvedColor,
            borderRadius: height / 2,
            position: 'absolute',
          }}
        />
      </Box>
    );
  }

  // === CIRCULAR ===
  return (
    <Box
      id={widgetId}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeW,
        borderColor: trackBg,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        id={fillId}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeW,
          borderColor: resolvedColor,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          position: 'absolute',
        }}
      />
    </Box>
  );
});

(Progress as any).skiaWidgetType = 'Progress';