import * as React from 'react';
import { Circle, RoundedRect } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useLayoutStore } from '../stores/layoutStore';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps, PanEvent } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
  LayoutStyle,
} from '../types/style.types';
import { resolveSemanticColor } from '../core/colorUtils';
import { runOnJS } from 'react-native-reanimated';

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
  x = 0,
  y = 0,
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
  const layout = useLayoutStore((s) => s.layoutMap[widgetId]);
  const finalX = layout?.rect.x ?? x;
  const finalY = layout?.rect.y ?? y;
  const finalWidth = layout?.rect.width ?? (typeof width === 'number' ? width : 200);

  const isDragging = React.useRef(false);
  const internalValue = useSharedValue(value);

  React.useEffect(() => {
    if (!isDragging.current) {
      internalValue.value = value;
    }
  }, [value, internalValue]);

  const ratio = useDerivedValue(() => (internalValue.value - min) / (max - min), [min, max]);
  const fillWidth = useDerivedValue(() => ratio.value * finalWidth, [finalWidth]);
  const trackY = finalY + thumbR - trackH / 2;

  const thumbCx = useDerivedValue(() => {
    return finalX + ratio.value * finalWidth;
  }, [finalX, finalWidth]);

  const calculateValue = (localX: number) => {
    const rawValue = min + (localX / finalWidth) * (max - min);
    let newValue = Math.max(min, Math.min(max, rawValue));
    if (step > 0) {
      newValue = Math.round((newValue - min) / step) * step + min;
    }
    return newValue;
  };

  const handlePanStart = (e: PanEvent) => {
    if (disabled) return;
    isDragging.current = true;
    const newValue = calculateValue(e?.localX ?? 0);
    internalValue.value = newValue;
    onChange?.(newValue);
  };

  const handlePanUpdate = (e: PanEvent) => {
    if (disabled) return;
    const newValue = calculateValue(e?.localX ?? 0);
    internalValue.value = newValue;
    onChange?.(newValue);
  };

  const handlePanEnd = () => {
    isDragging.current = false;
    onSlidingComplete?.(internalValue.value);
  };

  return (
    <Box
      id={widgetId}
      x={x}
      y={y}
      style={{
        width,
        height: totalHeight,
        backgroundColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
      }}
      hitTestBehavior="opaque"
      onPanStart={handlePanStart}
      onPanUpdate={handlePanUpdate}
      onPanEnd={handlePanEnd}
    >
      {/* Track background */}
      <RoundedRect
        x={finalX}
        y={trackY}
        width={finalWidth}
        height={trackH}
        r={trackH / 2}
        color={trackBg}
      />

      {/* Active fill */}
      <RoundedRect
        x={finalX}
        y={trackY}
        width={fillWidth}
        height={trackH}
        r={trackH / 2}
        color={activeColor}
      />

      {/* Thumb */}
      <Circle cx={thumbCx} cy={finalY + thumbR} r={thumbR} color={thumbClr} />
      <Circle
        cx={thumbCx}
        cy={finalY + thumbR}
        r={thumbR}
        color={activeColor}
        style="stroke"
        strokeWidth={2}
      />
    </Box>
  );
});

(Slider as any).skiaWidgetType = 'Slider';
