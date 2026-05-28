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
  GradientProps,
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
  /** Solid fill color (SemanticColor or CSS hex). Ignored when `gradient` is set. */
  color?: SemanticColor | string;
  /**
   * Gradient fill for the progress bar.
   * Overrides `color` when provided. Use `linearGradient()` helper or pass GradientProps directly.
   *
   * @example
   * import { linearGradient } from 'react-native-skia-kit';
   * <Progress value={0.6} gradient={linearGradient(['#667eea', '#764ba2'])} />
   */
  gradient?: GradientProps;
  /** Style override */
  style?: ProgressStyle;
}

export const Progress = React.memo(function Progress({
  variant = 'linear',
  value,
  color,
  gradient,
  style,
}: ProgressProps) {
  // ── 1. Context ──────────────────────────────────────────────────────────────
  const theme = useTheme();
  const { engine, engineId } = useEngineContext();

  // ── 2. Style & dimension computations (props-only, no hooks) ────────────────
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

  // ── 3. Node IDs (stable per-instance) ───────────────────────────────────────
  const widgetId = useWidgetId('Progress');
  const fillId = useWidgetId('ProgressFill');

  // ── 4. Value & ref ──────────────────────────────────────────────────────────
  const safeValue = isDeterminate ? Math.max(0, Math.min(1, value)) : 0;
  // Ref lưu safeValue mới nhất để dùng trong useLayoutEffect mà không thêm vào deps.
  // Mục đích: useLayoutEffect chỉ fire khi structural props thay đổi (fillId, isDeterminate,
  // finalWidth, variant), KHÔNG fire khi safeValue thay đổi.
  // safeValue changes được xử lý bởi withTiming (useEffect) → smooth animation, không instant snap.
  const safeValueRef = React.useRef(safeValue);
  safeValueRef.current = safeValue;

  // ── 5. Reanimated shared values ─────────────────────────────────────────────
  const progress = useSharedValue(safeValue);
  const indetProgress = useSharedValue(0);
  const updateCounter = useSharedValue(0);

  // ── 6. Layout measurement ───────────────────────────────────────────────────
  const layout = useNativeYogaLayout(widgetId, {
    width: variant === 'linear' ? width : size,
    height: variant === 'linear' ? height : size,
  });
  const finalWidth =
    layout?.width > 0 ? layout.width : typeof width === 'number' ? width : 200;
  // Phase 5: layoutSVs để worklet đọc layout trực tiếp mà không cần re-register
  const layoutSVs = useLayoutSharedValues(widgetId);
  const defaultWidth =
    variant === 'linear'
      ? typeof width === 'number'
        ? width
        : 200
      : style?.size ?? 48;

  // ── 7. Callbacks ─────────────────────────────────────────────────────────────
  // WORKLET-SAFE + THREAD-SAFE: dùng GPU transforms thay vì Yoga layout props.
  // determinate linear: scaleX (0..1) + transformOriginX=0 — không trigger Yoga.
  // indeterminate linear: translateX — đã đúng.
  // circular: rotateZ — đã đúng.
  const updateProgressUI = React.useCallback(
    (
      fId: string,
      isDet: boolean,
      p: number,
      _fw: number,
      v: 'linear' | 'circular'
    ) => {
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

  // ── 8. Effects & reactions ────────────────────────────────────────────────────

  // Animation control: start withTiming on value change, withRepeat for indeterminate.
  // P2 fix: cancel on unmount / isDeterminate switch to avoid ghost callbacks.
  React.useEffect(() => {
    if (isDeterminate) {
      progress.value = withTiming(safeValue, { duration: 250 });
    } else {
      indetProgress.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1, // infinite
        false
      );
    }
    return () => {
      cancelAnimation(progress);
      cancelAnimation(indetProgress);
    };
  }, [isDeterminate, safeValue, progress, indetProgress]);

  // 60fps worklet → C++ direct path (bypasses JS thread entirely).
  // Phase 5: reads layoutSVs.width.value inline so finalWidth not needed in deps.
  useAnimatedReaction(
    () => (isDeterminate ? progress.value : indetProgress.value),
    (p) => {
      'worklet';
      const fw =
        layoutSVs.width.value > 0 ? layoutSVs.width.value : defaultWidth;
      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        if (variant === 'circular') {
          direct.updateAnimatedStyles(fillId, { rotateZ: p * 360 });
        } else if (isDeterminate) {
          direct.updateAnimatedStyles(fillId, {
            scaleX: p,
            transformOriginX: 0,
          });
        } else {
          const fillW = fw * 0.4;
          direct.updateAnimatedStyles(fillId, { translateX: p * (fw - fillW) });
        }
      } else {
        // Fallback: throttle to ~15fps to avoid JS thread flooding
        updateCounter.value += 1;
        if (updateCounter.value % 4 === 0) {
          scheduleOnRN(updateProgressUI, fillId, isDeterminate, p, fw, variant);
        }
      }
    },
    [isDeterminate, fillId, variant, defaultWidth, engineId, updateProgressUI]
  );

  // Structural sync: fires on mount and when non-value props change.
  // safeValue intentionally excluded from deps — its changes are handled by withTiming
  // above, which animates smoothly. Including safeValue here would cause an instant
  // snap-to-target 1 frame before the animation reaches it ("extra segment" flicker).
  React.useLayoutEffect(() => {
    updateProgressUI(
      fillId,
      isDeterminate,
      safeValueRef.current,
      finalWidth,
      variant
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillId, isDeterminate, finalWidth, variant, updateProgressUI]);

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
            // width=100% (full track) — scaleX from transformOriginX=0 animates the visible portion.
            // Gradient spans the full width; at scaleX=p, only the left p% is visible → correct.
            width: '100%',
            height: '100%',
            backgroundColor: gradient ? undefined : resolvedColor,
            gradient,
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
