import * as React from 'react';
import { Box } from './Box';
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

// === Radio Types ===

export type RadioStyle = ColorStyle & BorderStyle & FlexChildStyle;

export interface RadioProps extends WidgetProps {
  /** Size (default: 24) */
  size?: number;
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: RadioStyle;
  /** Change callback */
  onChange?: (selected: boolean) => void;
  /** Press callback */
  onPress?: () => void;
}

/**
 * Radio — single selection within a group.
 * Equivalent to Flutter Radio.
 */
export const Radio = React.memo(function Radio({
  size = 24,
  selected = false,
  disabled = false,
  color = 'primary',
  style,
  onChange,
  onPress,
}: RadioProps) {
  const theme = useTheme();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
  const r = size / 2;
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

  const widgetId = useWidgetId('Radio');

  return (
    <Box
      id={widgetId}
      style={{
        width: size,
        height: size,
        backgroundColor: 'transparent',
        borderRadius: r,
        borderWidth: style?.borderWidth ?? 2,
        borderColor: style?.borderColor ?? borderColor,
        opacity: disabled ? 0.5 : 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      hitTestBehavior="translucent"
      onPress={handlePress}
    >
      {selected && (
        <Box 
          style={{
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: size * 0.25,
            backgroundColor: dotColor,
          }}
        />
      )}
    </Box>
  );
});

(Radio as any).skiaWidgetType = 'Radio';
