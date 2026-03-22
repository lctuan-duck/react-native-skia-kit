import * as React from 'react';
import { Circle } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps, PanEvent } from '../core/types';

export interface SliderProps extends WidgetProps {
  min?: number;
  max?: number;
  value?: number;
  disabled?: boolean;
  color?: string;
  trackColor?: string;
  thumbColor?: string;
  onChange?: (value: number) => void;
}

/**
 * Slider — continuous value selection via draggable thumb.
 * Equivalent to Flutter Slider.
 */
export const Slider = React.memo(function Slider({
  x = 0,
  y = 0,
  width = 200,
  min = 0,
  max = 100,
  value = 0,
  color,
  trackColor,
  thumbColor = 'white',
  disabled = false,
  onChange,
}: SliderProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const trackBg = trackColor ?? theme.colors.surfaceVariant;
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
      width={width}
      height={totalHeight}
      color="transparent"
      opacity={disabled ? 0.5 : 1}
      hitTestBehavior="opaque"
      onPanUpdate={handlePanUpdate}
    >
      {/* Track background */}
      <Box
        x={x}
        y={trackY}
        width={width}
        height={trackH}
        borderRadius={trackH / 2}
        color={trackBg}
      />

      {/* Active fill */}
      <Box
        x={x}
        y={trackY}
        width={Math.max(0, fillWidth)}
        height={trackH}
        borderRadius={trackH / 2}
        color={activeColor}
      />

      {/* Thumb */}
      <Circle cx={thumbCx} cy={y + thumbR} r={thumbR} color={thumbColor} />
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
