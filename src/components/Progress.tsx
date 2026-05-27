import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { useLayoutSharedValues } from '../hooks/useLayoutSharedValues';
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

  // Stable ref cho scheduleOnRN fallback và useLayoutEffect — capture engine per-instance
  const updateProgressUIRef = React.useRef(
    (fId: string, isDet: boolean, p: number, fw: number, v: 'linear' | 'circular') => {
      if (v === 'circular') {
        engine.updateAnimatedStyles(fId, { rotateZ: p * 360 });
      } else if (isDet) {
        engine.updateAnimatedStyles(fId, { width: p * fw });
      } else {
        const fillW = fw * 0.4;
        engine.updateAnimatedStyles(fId, { translateX: p * (fw - fillW) });
      }
      (global as any).skiaKitScrollRedraw?.();
    }
  );
  updateProgressUIRef.current = (fId, isDet, p, fw, v) => {
    if (v === 'circular') {
      engine.updateAnimatedStyles(fId, { rotateZ: p * 360 });
    } else if (isDet) {
      engine.updateAnimatedStyles(fId, { width: p * fw });
    } else {
      const fillW = fw * 0.4;
      engine.updateAnimatedStyles(fId, { translateX: p * (fw - fillW) });
    }
    (global as any).skiaKitScrollRedraw?.();
  };

  const layout = useNativeYogaLayout(widgetId, {
    width: variant === 'linear' ? width : size,
    height: variant === 'linear' ? height : size,
  });

  const finalWidth =
    layout?.width > 0 ? layout.width : typeof width === 'number' ? width : 200;

  // Phase 5: layoutSVs để worklet đọc layout trực tiếp mà không cần re-register
  const layoutSVs = useLayoutSharedValues(widgetId);
  const defaultWidth = variant === 'linear'
    ? (typeof width === 'number' ? width : 200)
    : (style?.size ?? 48);

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
      // Phase 5: đọc layout trực tiếp từ SharedValue — không qua JS state
      // Không cần finalWidth trong deps → không re-register khi layout thay đổi
      const fw = layoutSVs.width.value > 0 ? layoutSVs.width.value : defaultWidth;
      const direct = (global as any).updateAnimatedStylesDirect;
      if (typeof direct === 'function') {
        // Direct worklet → C++ path — no JS thread hop (critical for withRepeat @ 60fps)
        if (variant === 'circular') {
          direct(fillId, { rotateZ: p * 360 });
        } else if (isDeterminate) {
          direct(fillId, { width: p * fw });
        } else {
          const fillW = fw * 0.4;
          direct(fillId, { translateX: p * (fw - fillW) });
        }
        (global as any).skiaKitScrollRedraw?.();
      } else {
        // Fallback: throttle to ~15fps to avoid JS thread flooding
        updateCounter.value += 1;
        if (updateCounter.value % 4 === 0) {
          scheduleOnRN(
            updateProgressUIRef.current,
            fillId,
            isDeterminate,
            p,
            fw, // đọc từ SharedValue trên worklet thread, rồi pass sang JS
            variant
          );
        }
      }
    },
    // Phase 5: finalWidth removed from deps — worklet reads layoutSVs.width.value inline.
    // layoutSVs.width is a stable SharedValue ref — NOT needed in deps array.
    [isDeterminate, fillId, variant, defaultWidth]
  );

  React.useLayoutEffect(() => {
    updateProgressUIRef.current(fillId, isDeterminate, safeValue, finalWidth, variant);
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