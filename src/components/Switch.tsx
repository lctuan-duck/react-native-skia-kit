import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import { resolveSemanticColor } from '../core/colorUtils';

// === Switch Types ===

export type SwitchStyle = ColorStyle &
  FlexChildStyle & {
    trackColor?: string;
    thumbColor?: string;
    width?: number;
    height?: number;
  };

export interface SwitchProps extends WidgetProps {
  /** Current value */
  value?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: SwitchStyle;
  /** Change callback */
  onChange?: (value: boolean) => void;
  /** Press callback */
  onPress?: () => void;
}

/**
 * Switch — toggle on/off with animated thumb.
 * Equivalent to Flutter Switch.
 */
export const Switch = React.memo(function Switch({
  value = false,
  disabled = false,
  color = 'primary',
  style,
  onChange,
  onPress,
}: SwitchProps) {
  const theme = useTheme();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
  const inactiveTrack = style?.trackColor ?? theme.colors.border;
  const thumbClr = style?.thumbColor ?? 'white';

  const widgetId = useWidgetId('Switch');
  const finalW = style?.width ?? 48;
  const finalH = style?.height ?? 28;

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

  const thumbSize = finalH - 4;

  return (
    <Box
      id={widgetId}
      style={{
        width: finalW,
        height: finalH,
        borderRadius: finalH / 2,
        backgroundColor: trackFill,
        opacity: disabled ? 0.5 : 1,
        justifyContent: 'center',
        alignItems: value ? 'end' : 'start',
        padding: 2,
      }}
      hitTestBehavior="translucent"
      onPress={handlePress}
    >
      <Box 
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumbSize / 2,
          backgroundColor: thumbClr,
        }}
      />
    </Box>
  );
});

(Switch as any).skiaWidgetType = 'Switch';
