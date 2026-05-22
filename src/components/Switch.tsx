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
import { resolveSemanticColor, parseColor } from '../core/colorUtils';
import { uiEngine } from '../core/GlobalEngine';
import { useSharedValue, withTiming, useAnimatedReaction, interpolateColor } from 'react-native-reanimated';

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
  const thumbClr = style?.thumbColor ?? theme.colors.background;

  const trackId = useWidgetId('SwitchTrack');
  const thumbId = useWidgetId('SwitchThumb');
  const finalW = style?.width ?? 48;
  const finalH = style?.height ?? 28;

  const disabledColor = theme.colors.textDisabled;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!value);
    onPress?.();
  };

  const thumbSize = finalH - 4;
  const maxTravel = finalW - 4 - thumbSize; // padding = 2 => total padding = 4

  const progress = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value, progress]);

  // Use Worklet to directly update UIEngine for smooth 60fps animations
  useAnimatedReaction(
    () => progress.value,
    (p) => {
      const currentTrackColor = interpolateColor(
        p,
        [0, 1],
        [inactiveTrack, disabled ? disabledColor : activeColor]
      );
      
      const currentLeft = p * maxTravel;

      // Update C++ Render Tree for color
      uiEngine.updateBoxNode(
        trackId, 
        {}, 
        { 
          backgroundColor: parseColor(currentTrackColor),
          borderRadius: finalH / 2,
        }
      );
      
      // Update C++ Layout Tree for thumb position
      uiEngine.updateLayoutNode(
        thumbId, 
        { paddingLeft: currentLeft }
      );
    },
    [inactiveTrack, activeColor, disabled, disabledColor, maxTravel, trackId, thumbId, finalH]
  );

  return (
    <Box
      id={trackId}
      style={{
        width: finalW,
        height: finalH,
        borderRadius: finalH / 2,
        // Start with the correct color
        backgroundColor: value ? (disabled ? disabledColor : activeColor) : inactiveTrack,
        opacity: disabled ? 0.5 : 1,
        justifyContent: 'center',
        padding: 2,
      }}
      hitTestBehavior="translucent"
      onPress={handlePress}
    >
      <Box
        id={thumbId}
        style={{
          paddingLeft: value ? maxTravel : 0, // start correctly
        }}
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
    </Box>
  );
});

(Switch as any).skiaWidgetType = 'Switch';
