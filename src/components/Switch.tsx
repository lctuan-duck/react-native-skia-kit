import * as React from 'react';
import { useEffect } from 'react';
import { Circle } from '@shopify/react-native-skia';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useLayoutStore } from '../stores/layoutStore';
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

  const widgetId = useWidgetId('Switch');
  const layout = useLayoutStore((s) => s.layoutMap[widgetId]);
  const finalW = layout?.rect.width ?? (typeof style?.width === 'number' ? style.width : 48);
  const finalH = layout?.rect.height ?? (typeof style?.height === 'number' ? style.height : 28);

  const finalX = layout?.rect.x ?? x;
  const finalY = layout?.rect.y ?? y;

  const thumbR = finalH / 2 - 2;
  const targetX = value ? finalX + finalW - thumbR - 2 : finalX + thumbR + 2;
  const thumbX = useSharedValue(targetX);

  useEffect(() => {
    thumbX.value = withTiming(targetX, {
      duration: 200,
    });
  }, [targetX, thumbX]);

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

  return (
    <Box
      id={widgetId}
      x={x}
      y={y}
      style={{
        width: style?.width ?? 48,
        height: style?.height ?? 28,
        borderRadius: finalH / 2,
        backgroundColor: trackFill,
        opacity: disabled ? 0.5 : 1,
      }}
      hitTestBehavior="translucent"
      interactive={disabled ? 'none' : 'ripple'}
      onPress={handlePress}
    >
      <Circle cx={thumbX} cy={finalY + finalH / 2} r={thumbR} color={thumbClr} />
    </Box>
  );
});

(Switch as any).skiaWidgetType = 'Switch';
