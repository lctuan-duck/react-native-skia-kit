import * as React from 'react';
import { Box } from './Box';
import { Icon } from './Icon';
import { useWidgetId } from '../hooks/useWidgetId';
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

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!checked);
    onPress?.();
  };

  const widgetId = useWidgetId('Checkbox');

  return (
    <Box
      id={widgetId}
      style={{
        width: size,
        height: size,
        borderRadius: style?.borderRadius ?? 4,
        backgroundColor: bgColor,
        borderWidth: style?.borderWidth ?? 2,
        borderColor: style?.borderColor ?? borderColor,
        opacity: disabled ? 0.5 : 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      hitTestBehavior="translucent"
      onPress={handlePress}
    >
      {checked && (
        <Icon
          name="check"
          size={size * 0.8}
          color="white"
        />
      )}
    </Box>
  );
});

(Checkbox as any).skiaWidgetType = 'Checkbox';
