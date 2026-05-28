import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { useLayoutSharedValues } from '../hooks/useLayoutSharedValues';
import type { WidgetProps, PanEvent } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
  LayoutStyle,
} from '../types/style.types';
import { resolveSemanticColor } from '../utils/color';
import { useEngineContext } from '../core/EngineContext';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';


// === Slider Types ===

export type SliderStyle = ColorStyle &
  FlexChildStyle &
  LayoutStyle & {
    trackColor?: string;
    thumbColor?: string;
  };

export interface SliderProps extends WidgetProps {
  /** Min value */
  min?: number;
  /** Max value */
  max?: number;
  /** Current value */
  value?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: SliderStyle;
  /** Step value for snapping (default is 1) */
  step?: number;
  /** Change callback */
  onChange?: (value: number) => void;
  /** Callback fired when the user releases the slider */
  onSlidingComplete?: (value: number) => void;
}

/**
 * Slider — continuous value selection via draggable thumb.
 * Equivalent to Flutter Slider.
 */
export const Slider = React.memo(function Slider({
  min = 0,
  max = 100,
  value = 0,
  step = 1,
  color = 'primary',
  disabled = false,
  style,
  onChange,
  onSlidingComplete,
}: SliderProps) {
  const theme = useTheme();
  const { engine, engineId } = useEngineContext();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
  const trackBg = style?.trackColor ?? theme.colors.surfaceVariant;
  const thumbClr = style?.thumbColor ?? 'white';
  const width = style?.width ?? 200;

  const trackH = 6;
  const thumbR = 12;
  const totalHeight = thumbR * 2;
  const widgetId = useWidgetId('Slider');
  const fillId = useWidgetId('SliderFill');
  const thumbId = useWidgetId('SliderThumb');

  // WORKLET-SAFE + THREAD-SAFE: dùng GPU transforms thay vì Yoga layout props.
  // width/left là Yoga props → không an toàn từ UI thread worklet → JniException + giật.
  // scaleX + transformOriginX=0: thu giãn fill từ trái, không trigger Yoga.
  // translateX: dịch chuyển thumb, không trigger Yoga.
  const updateSliderUI = React.useCallback(
    (fId: string, tId: string, ratio: number) => {
      engine.updateAnimatedStyles(fId, { scaleX: ratio, transformOriginX: 0 });
      engine.updateAnimatedStyles(tId, { translateX: ratio * finalWidth - thumbR });
    },
    [engine, finalWidth, thumbR]
  );

  const layout = useNativeYogaLayout(widgetId, { width, height: totalHeight });
  const finalWidth =
    layout?.width > 0 ? layout.width : typeof width === 'number' ? width : 200;

  // Phase 5: layoutSVs để worklet đọc layout trực tiếp mà không cần re-register
  const layoutSVs = useLayoutSharedValues(widgetId);
  const defaultWidth = typeof width === 'number' ? width : 200;

  // FIX: Không dùng React state cho internalValue trong khi drag.
  // Visual (fill + thumb) được control hoàn toàn bởi worklet qua animatedRatio.
  // internalValueRef chỉ để onSlidingComplete trả về đúng giá trị cuối.
  const internalValueRef = React.useRef(value);
  const [internalValue, setInternalValue] = React.useState(value);
  const isDragging = React.useRef(false);

  // Throttle onChange: tối đa 1 lần/30ms (~30fps).
  // Caller (vd: setProgressValue) trigger reconciler commit → calculateLayout.
  // Nếu gọi mỗi pixel → flood reconciler → lag cực kì.
  const lastOnChangeTimeRef = React.useRef(0);
  const pendingValueRef = React.useRef<number | null>(null);

  const throttledOnChange = React.useCallback(
    (newVal: number) => {
      pendingValueRef.current = newVal;
      const now = Date.now();
      if (now - lastOnChangeTimeRef.current >= 30) {
        lastOnChangeTimeRef.current = now;
        onChange?.(newVal);
      }
    },
    [onChange]
  );

  const getRatio = React.useCallback(
    (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min))),
    [min, max]
  );

  const animatedRatio = useSharedValue(getRatio(value));

  // useLayoutEffect for withTiming: Reanimated registers Choreographer BEFORE endCommit
  // → worklet fires BEFORE doRender at Frame N → fill/thumb positions updated before paint.
  // (setInternalValue stays in useEffect — setState inside useLayoutEffect can cause
  // unexpected synchronous re-renders in React's commit phase.)
  React.useLayoutEffect(() => {
    if (!isDragging.current) {
      animatedRatio.value = withTiming(getRatio(value), { duration: 200 });
    }
  }, [value, min, max, animatedRatio, getRatio]);

  // Internal value sync (state update — safe in async useEffect).
  React.useEffect(() => {
    if (!isDragging.current) {
      internalValueRef.current = value;
      setInternalValue(value);
    }
  }, [value]);

  useAnimatedReaction(
    () => animatedRatio.value,
    (r) => {
      'worklet';
      // GPU transforms: scaleX cho fill, translateX cho thumb.
      // Không dùng width/left (Yoga props) → an toàn trên UI thread, không giật.
      const fw = layoutSVs.width.value > 0 ? layoutSVs.width.value : defaultWidth;
      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        direct.updateAnimatedStyles(fillId, { scaleX: r, transformOriginX: 0 });
        direct.updateAnimatedStyles(thumbId, { translateX: r * fw - thumbR });
      } else {
        runOnJS(updateSliderUI)(fillId, thumbId, r);
      }
    },
    [fillId, thumbId, thumbR, defaultWidth, engineId, updateSliderUI]
  );

  const calculateValue = (localX: number) => {
    const rawValue = min + (localX / finalWidth) * (max - min);
    let newValue = Math.max(min, Math.min(max, rawValue));
    if (step > 0) {
      newValue = Math.round((newValue - min) / step) * step + min;
    }
    return newValue;
  };

  const startLocalX = React.useRef(0);

  const handlePanStart = (e: PanEvent) => {
    if (disabled) return;
    isDragging.current = true;
    startLocalX.current = e?.localX ?? 0;
    const newValue = calculateValue(startLocalX.current);
    internalValueRef.current = newValue;
    setInternalValue(newValue);
    // Visual animation đã được worklet xử lý
    animatedRatio.value = getRatio(newValue);
    throttledOnChange(newValue);
  };

  const handlePanUpdate = (e: PanEvent) => {
    if (disabled) return;
    const currentLocalX = startLocalX.current + (e?.translationX ?? 0);
    const newValue = calculateValue(currentLocalX);
    internalValueRef.current = newValue;
    // FIX: KHÔNG gọi setInternalValue trong pan update.
    // Visual đã được worklet xử lý qua animatedRatio (Path 2, không rebuild).
    // setInternalValue mỗi pixel → 2 reconciler commits/pixel → calculateLayout flood.
    animatedRatio.value = getRatio(newValue);
    throttledOnChange(newValue);
  };

  const handlePanEnd = () => {
    isDragging.current = false;
    // Flush pending onChange với giá trị cuối chính xác
    if (pendingValueRef.current != null) {
      onChange?.(pendingValueRef.current);
      pendingValueRef.current = null;
    }
    setInternalValue(internalValueRef.current);
    onSlidingComplete?.(internalValueRef.current);
  };

  // Initial calculation for first render
  const initialRatio = getRatio(internalValue);

  React.useLayoutEffect(() => {
    // Initial sync: đặt visual về đúng vị trí khởi đầu qua GPU transforms
    updateSliderUI(fillId, thumbId, initialRatio);
  }, [fillId, thumbId, initialRatio, updateSliderUI]);

  return (
    <Box
      id={widgetId}
      style={{
        width: finalWidth,
        height: totalHeight,
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      hitTestBehavior="opaque"
      onPanStart={handlePanStart}
      onPanUpdate={handlePanUpdate}
      onPanEnd={handlePanEnd}
    >
      {/* Track Background */}
      <Box
        style={{
          width: '100%',
          height: trackH,
          backgroundColor: trackBg,
          borderRadius: trackH / 2,
          position: 'absolute',
          top: (totalHeight - trackH) / 2,
        }}
      />

      {/* Track Fill — width=finalWidth (full), scaleX animates 0..1 from left via transformOriginX=0 */}
      <Box
        id={fillId}
        style={{
          width: finalWidth,
          height: trackH,
          backgroundColor: activeColor,
          borderRadius: trackH / 2,
          position: 'absolute',
          top: (totalHeight - trackH) / 2,
          left: 0,
        }}
      />

      {/* Thumb */}
      <Box
        id={thumbId}
        style={{
          width: thumbR * 2,
          height: thumbR * 2,
          borderRadius: thumbR,
          backgroundColor: thumbClr,
          borderWidth: 2,
          borderColor: activeColor,
          position: 'absolute',
          top: 0,
        }}
      />
    </Box>
  );
});

(Slider as any).skiaWidgetType = 'Slider';