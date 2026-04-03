import * as React from 'react';
import { Path } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import { resolveSemanticColor } from '../core/colorUtils';

// === Checkbox Types ===

export type CheckboxStyle = ColorStyle & BorderStyle & FlexChildStyle;

export interface CheckboxProps extends WidgetProps {
  /** Size */
  size?: number;
  /** Checked state */
  checked?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: CheckboxStyle;
  /** Change callback */
  onChange?: (checked: boolean) => void;
  /** Press callback */
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
  color = 'primary',
  style,
  onChange,
  onPress,
}: CheckboxProps) {
  const theme = useTheme();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
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
      style={{
        width: size,
        height: size,
        borderRadius: style?.borderRadius ?? 4,
        backgroundColor: bgColor,
        borderWidth: style?.borderWidth ?? 2,
        borderColor: style?.borderColor ?? borderColor,
        opacity: disabled ? 0.5 : 1,
      }}
      hitTestBehavior="translucent"
      interactive={disabled ? 'none' : 'ripple'}
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
