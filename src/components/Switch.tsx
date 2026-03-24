import * as React from 'react';
import { useEffect } from 'react';
import { Circle } from '@shopify/react-native-skia';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../core/style.types';
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
  x = 0,
  y = 0,
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

  const w = style?.width ?? 48;
  const h = style?.height ?? 28;

  const thumbR = h / 2 - 2;
  const thumbX = useSharedValue(
    value ? x + w - thumbR - 4 : x + thumbR + 4
  );

  useEffect(() => {
    thumbX.value = withTiming(value ? x + w - thumbR - 4 : x + thumbR + 4, {
      duration: 200,
    });
  }, [value, x, w, thumbR, thumbX]);

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
    layout: { x, y, width: w, height: h },
  });

  return (
    <Box
      x={x}
      y={y}
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        backgroundColor: trackFill,
        opacity: disabled ? 0.5 : 1,
      }}
      hitTestBehavior="opaque"
      onPress={handlePress}
    >
      <Circle cx={thumbX} cy={y + h / 2} r={thumbR} color={thumbClr} />
    </Box>
  );
});
