import * as React from 'react';
import { useEffect } from 'react';
import { Circle } from '@shopify/react-native-skia';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface SwitchProps extends WidgetProps {
  value?: boolean;
  disabled?: boolean;
  color?: string;
  trackColor?: string;
  thumbColor?: string;
  onChange?: (value: boolean) => void;
  onPress?: () => void;
}

/**
 * Switch — toggle on/off with animated thumb.
 * Equivalent to Flutter Switch.
 */
export const Switch = React.memo(function Switch({
  x = 0,
  y = 0,
  width = 48,
  height = 28,
  value = false,
  disabled = false,
  color,
  trackColor,
  thumbColor = 'white',
  onChange,
  onPress,
}: SwitchProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const inactiveTrack = trackColor ?? theme.colors.border;

  const thumbR = height / 2 - 2;
  const thumbX = useSharedValue(
    value ? x + width - thumbR - 4 : x + thumbR + 4
  );

  useEffect(() => {
    thumbX.value = withTiming(value ? x + width - thumbR - 4 : x + thumbR + 4, {
      duration: 200,
    });
  }, [value, x, width, thumbR, thumbX]);

  const trackFill = value
    ? disabled
      ? theme.colors.textDisabled
      : activeColor
    : inactiveTrack;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!value);
    onPress?.();
  };

  useWidget({
    type: 'Switch',
    layout: { x, y, width, height },
  });

  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      borderRadius={height / 2}
      color={trackFill}
      opacity={disabled ? 0.5 : 1}
      hitTestBehavior="opaque"
      onPress={handlePress}
    >
      <Circle cx={thumbX} cy={y + height / 2} r={thumbR} color={thumbColor} />
    </Box>
  );
});
