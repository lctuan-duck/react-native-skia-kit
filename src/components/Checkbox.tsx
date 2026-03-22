import * as React from 'react';
import { Path } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface CheckboxProps extends WidgetProps {
  size?: number;
  checked?: boolean;
  disabled?: boolean;
  color?: string;
  onChange?: (checked: boolean) => void;
  onPress?: () => void;
}

/**
 * Checkbox — boolean toggle with checkmark.
 * Equivalent to Flutter Checkbox.
 */
export const Checkbox = React.memo(function Checkbox({
  x = 0,
  y = 0,
  size = 24,
  checked = false,
  disabled = false,
  color,
  onChange,
  onPress,
}: CheckboxProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const borderColor = disabled
    ? theme.colors.textDisabled
    : checked
    ? activeColor
    : theme.colors.outline;
  const bgColor = checked
    ? disabled
      ? theme.colors.textDisabled
      : activeColor
    : 'transparent';

  // SVG-style checkmark path
  const checkPath = `M${x + size * 0.2} ${y + size * 0.5} l${size * 0.25} ${
    size * 0.25
  } l${size * 0.35} -${size * 0.35}`;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!checked);
    onPress?.();
  };

  useWidget({
    type: 'Checkbox',
    layout: { x, y, width: size, height: size },
  });

  return (
    <Box
      x={x}
      y={y}
      width={size}
      height={size}
      borderRadius={4}
      color={bgColor}
      borderWidth={2}
      borderColor={borderColor}
      opacity={disabled ? 0.5 : 1}
      hitTestBehavior="opaque"
      onPress={handlePress}
    >
      {checked && (
        <Path
          path={checkPath}
          color="white"
          style="stroke"
          strokeWidth={2.5}
          strokeCap="round"
          strokeJoin="round"
        />
      )}
    </Box>
  );
});
