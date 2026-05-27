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
import { resolveSemanticColor, parseColor } from '../utils/color';
import { useEngineContext } from '../core/EngineContext';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  interpolateColor,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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
  const { engine, engineId } = useEngineContext();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
  const inactiveTrack = style?.trackColor ?? theme.colors.border;
  const thumbClr = style?.thumbColor ?? theme.colors.background;

  // Stable ref cho scheduleOnRN fallback — capture engine per-instance
  const updateSwitchUIRef = React.useRef(
    (tid: string, cid: string, colorStr: string, leftPadding: number) => {
      engine.updateAnimatedStyles(tid, { backgroundColor: parseColor(colorStr) });
      engine.updateAnimatedStyles(cid, { translateX: leftPadding });
      (global as any).skiaKitScrollRedraw?.();
    }
  );
  updateSwitchUIRef.current = (tid, cid, colorStr, leftPadding) => {
    engine.updateAnimatedStyles(tid, { backgroundColor: parseColor(colorStr) });
    engine.updateAnimatedStyles(cid, { translateX: leftPadding });
    (global as any).skiaKitScrollRedraw?.();
  };


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

  useAnimatedReaction(
    () => progress.value,
    (p) => {
      'worklet';
      const currentTrackColor = interpolateColor(
        p,
        [0, 1],
        [inactiveTrack, disabled ? disabledColor : activeColor]
      );
      const currentLeft = p * maxTravel;

      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        // Direct worklet → C++ — parse color string to numeric SkColor
        direct.updateAnimatedStyles(trackId, { backgroundColor: parseColor(currentTrackColor) });
        direct.updateAnimatedStyles(thumbId, { translateX: currentLeft });
      } else {
        scheduleOnRN(
          updateSwitchUIRef.current,
          trackId,
          thumbId,
          currentTrackColor.toString(),
          currentLeft
        );
      }
    },
    [
      inactiveTrack,
      activeColor,
      disabled,
      disabledColor,
      maxTravel,
      trackId,
      thumbId,
      finalH,
      engineId,
    ]
  );

  return (
    <Box
      id={trackId}
      style={{
        ...style,
        width: finalW,
        height: finalH,
        borderRadius: finalH / 2,
        opacity: disabled ? 0.5 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 2,
      }}
      hitTestBehavior="translucent"
      onPress={handlePress}
    >
      <Box
        id={thumbId}
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumbSize / 2,
          backgroundColor: thumbClr,
          shadowColor: theme.colors.shadow,
          shadowOffsetY: 1,
          shadowBlur: 2,
        }}
      />
    </Box>
  );
});

(Switch as any).skiaWidgetType = 'Switch';