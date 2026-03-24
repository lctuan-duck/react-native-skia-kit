import * as React from 'react';
import { Circle } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps, PanEvent } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import { resolveSemanticColor } from '../core/colorUtils';

// === Slider Types ===

export type SliderStyle = ColorStyle &
  FlexChildStyle & {
    trackColor?: string;
    thumbColor?: string;
    width?: number;
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
  /** Change callback */
  onChange?: (value: number) => void;
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
  color = 'primary',
  disabled = false,
  style,
  onChange,
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
  const trackY = y + thumbR - trackH / 2;

  const ratio = (value - min) / (max - min);
  const fillWidth = ratio * width;

  const thumbCx = useDerivedValue(() => {
    return x + ratio * width;
  }, [value, x, width, min, max]);

  const handlePanUpdate = (e: PanEvent) => {
    if (disabled) return;
    const newValue = Math.min(
      max,
      Math.max(min, min + (((e?.absoluteX ?? 0) - x) / width) * (max - min))
    );
    onChange?.(Math.round(newValue));
  };

  useWidget({
    type: 'Slider',
    layout: { x, y, width, height: totalHeight },
  });

  return (
    <Box
      x={x}
      y={y}
      style={{
        width,
        height: totalHeight,
        backgroundColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
      }}
      hitTestBehavior="opaque"
      onPanUpdate={handlePanUpdate}
    >
      {/* Track background */}
      <Box
        x={x}
        y={trackY}
        style={{
          width,
          height: trackH,
          borderRadius: trackH / 2,
          backgroundColor: trackBg,
        }}
      />

      {/* Active fill */}
      <Box
        x={x}
        y={trackY}
        style={{
          width: Math.max(0, fillWidth),
          height: trackH,
          borderRadius: trackH / 2,
          backgroundColor: activeColor,
        }}
      />

      {/* Thumb */}
      <Circle cx={thumbCx} cy={y + thumbR} r={thumbR} color={thumbClr} />
      <Circle
        cx={thumbCx}
        cy={y + thumbR}
        r={thumbR}
        color={activeColor}
        style="stroke"
        strokeWidth={2}
      />
    </Box>
  );
});
