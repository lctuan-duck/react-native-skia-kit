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
import { useEngineContext } from '../core/EngineContext';
import {
  useSharedValue,
  withTiming,
  withRepeat,
  cancelAnimation,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';


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
  const { engine, engineId } = useEngineContext();

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

  // WORKLET-SAFE + THREAD-SAFE: dùng GPU transforms thay vì Yoga layout props.
  // determinate linear: scaleX (0..1) + transformOriginX=0 — không trigger Yoga.
  // indeterminate linear: translateX — đã đúng.
  // circular: rotateZ — đã đúng.
  const updateProgressUI = React.useCallback(
    (fId: string, isDet: boolean, p: number, _fw: number, v: 'linear' | 'circular') => {
      if (v === 'circular') {
        engine.updateAnimatedStyles(fId, { rotateZ: p * 360 });
      } else if (isDet) {
        // scaleX thay vì width — GPU transform, không trigger Yoga
        engine.updateAnimatedStyles(fId, { scaleX: p, transformOriginX: 0 });
      } else {
        const fillW = _fw * 0.4;
        engine.updateAnimatedStyles(fId, { translateX: p * (_fw - fillW) });
      }
    },
    [engine]
  );

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
      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        // Direct worklet → C++ path — no JS thread hop (critical for withRepeat @ 60fps)
        if (variant === 'circular') {
          direct.updateAnimatedStyles(fillId, { rotateZ: p * 360 });
        } else if (isDeterminate) {
          // scaleX thay vì width (Yoga) — GPU transform, thread-safe, 60fps
          direct.updateAnimatedStyles(fillId, { scaleX: p, transformOriginX: 0 });
        } else {
          const fillW = fw * 0.4;
          direct.updateAnimatedStyles(fillId, { translateX: p * (fw - fillW) });
        }
      } else {
        // Fallback: throttle to ~15fps to avoid JS thread flooding
        updateCounter.value += 1;
        if (updateCounter.value % 4 === 0) {
          runOnJS(updateProgressUI)(
            fillId,
            isDeterminate,
            p,
            fw,
            variant
          );
        }
      }
    },
    // Phase 5: finalWidth removed from deps — worklet reads layoutSVs.width.value inline.
    // layoutSVs.width is a stable SharedValue ref — NOT needed in deps array.
    [isDeterminate, fillId, variant, defaultWidth, engineId, updateProgressUI]
  );

  React.useLayoutEffect(() => {
    updateProgressUI(fillId, isDeterminate, safeValue, finalWidth, variant);
  }, [fillId, isDeterminate, safeValue, finalWidth, variant, updateProgressUI]);

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
            // width=100% (initial full width) — scaleX animates from 0 to 1 via transformOriginX=0
            // Không dùng width animation (Yoga prop) — dùng scaleX (GPU transform) để smooth 60fps
            width: '100%',
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