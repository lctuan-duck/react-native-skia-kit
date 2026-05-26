import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import type { WidgetProps, PanEvent } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
  LayoutStyle,
} from '../types/style.types';
import { resolveSemanticColor } from '../utils/color';
import { uiEngine } from '../core/GlobalEngine';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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

const updateSliderUI = (
  fillId: string,
  thumbId: string,
  fillW: number,
  thumbLeft: number
) => {
  if (uiEngine) {
    uiEngine.updateLayoutNode(fillId, { width: fillW });
    uiEngine.updateLayoutNode(thumbId, { left: thumbLeft });
    (global as any).skiaKitRequestRedraw?.();
  }
};

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

  const layout = useNativeYogaLayout(widgetId, { width, height: totalHeight });
  const finalWidth =
    layout?.width > 0 ? layout.width : typeof width === 'number' ? width : 200;

  const [internalValue, setInternalValue] = React.useState(value);
  const isDragging = React.useRef(false);

  const getRatio = React.useCallback(
    (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min))),
    [min, max]
  );

  const animatedRatio = useSharedValue(getRatio(value));

  React.useEffect(() => {
    if (!isDragging.current) {
      setInternalValue(value);
      animatedRatio.value = withTiming(getRatio(value), { duration: 200 });
    }
  }, [value, min, max, animatedRatio, getRatio]);

  useAnimatedReaction(
    () => animatedRatio.value,
    (r) => {
      const fillW = r * finalWidth;
      const thumbCx = r * finalWidth;

      scheduleOnRN(updateSliderUI, fillId, thumbId, fillW, thumbCx - thumbR);
    },
    [finalWidth, fillId, thumbId, thumbR]
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
    setInternalValue(newValue);
    animatedRatio.value = getRatio(newValue);
    onChange?.(newValue);
  };

  const handlePanUpdate = (e: PanEvent) => {
    if (disabled) return;
    const currentLocalX = startLocalX.current + (e?.translationX ?? 0);
    const newValue = calculateValue(currentLocalX);
    setInternalValue(newValue);
    animatedRatio.value = getRatio(newValue);
    onChange?.(newValue);
  };

  const handlePanEnd = () => {
    isDragging.current = false;
    onSlidingComplete?.(internalValue);
  };

  // Initial calculation for first render
  const initialRatio = getRatio(internalValue);
  const initialFillWidth = initialRatio * finalWidth;
  const initialThumbLeft = initialRatio * finalWidth - thumbR;

  React.useLayoutEffect(() => {
    updateSliderUI(fillId, thumbId, initialFillWidth, initialThumbLeft);
  }, [fillId, thumbId, initialFillWidth, initialThumbLeft]);

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

      {/* Track Fill */}
      <Box
        id={fillId}
        style={{
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
