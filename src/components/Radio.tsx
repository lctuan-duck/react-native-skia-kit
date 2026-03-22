import * as React from 'react';
import { Circle } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface RadioProps extends WidgetProps {
  /** Size (default: 24) */
  size?: number;
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Active color */
  color?: string;
  /** Change callback */
  onChange?: (selected: boolean) => void;
  /** Press callback */
  onPress?: () => void;
}

/**
 * Radio — single selection within a group.
 * Composition: Box (outer ring) + Circle (inner dot when selected).
 *
 * Tương đương Flutter Radio.
 */
export const Radio = React.memo(function Radio({
  x = 0,
  y = 0,
  size = 24,
  selected = false,
  disabled = false,
  color,
  onChange,
  onPress,
}: RadioProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  const borderColor = disabled
    ? theme.colors.textDisabled
    : selected
    ? activeColor
    : theme.colors.outline;
  const dotColor = disabled ? theme.colors.textDisabled : activeColor;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!selected);
    onPress?.();
  };

  useWidget<{ selected: boolean; disabled: boolean }>({
    type: 'Radio',
    layout: { x, y, width: size, height: size },
    props: { selected, disabled },
  });

  return (
    <Box
      x={x}
      y={y}
      width={size}
      height={size}
      color="transparent"
      borderRadius={r}
      borderWidth={2}
      borderColor={borderColor}
      opacity={disabled ? 0.5 : 1}
      hitTestBehavior="opaque"
      onPress={handlePress}
    >
      {selected && <Circle cx={cx} cy={cy} r={r * 0.4} color={dotColor} />}
    </Box>
  );
});
