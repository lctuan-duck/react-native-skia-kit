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
  runOnJS,
} from 'react-native-reanimated';


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

  // WORKLET-SAFE: useCallback + runOnJS thay vì mutable ref
  const updateSwitchUI = React.useCallback(
    (tid: string, cid: string, colorStr: string, leftPadding: number) => {
      engine.updateAnimatedStyles(tid, { backgroundColor: parseColor(colorStr) });
      engine.updateAnimatedStyles(cid, { translateX: leftPadding });
    },
    [engine]
  );

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

  // Track previous value to distinguish mount from state changes.
  const prevValueRef = React.useRef<boolean | null>(null);
  const prevDisabledRef = React.useRef<boolean | null>(null);

  // useLayoutEffect: fires AFTER commitUpdate but BEFORE endCommit schedules doRender.
  //
  // Flicker root cause (two paths):
  //
  // A. MOUNT FLICKER: C++ BoxNode._translateX defaults to 0 and _backgroundColor to 0.
  //    On mount with value=true, without override:
  //      doRender → thumb appears at left (translateX=0) and track shows transparent.
  //    Fix: set CURRENT state synchronously → correct first frame ✓
  //
  // B. STATE-CHANGE FLICKER: commitUpdate may not write track backgroundColor (it's not
  //    in static JSX style — purely animated). _animatedProps still holds OLD values.
  //    Fix: override with START state (opposite side / starting track color) before VSync.
  //
  // GUARD:
  //   isMount                → set CURRENT state (correct first paint)
  //   valueChanged           → set animation START state (opposite of target)
  //   disabledChanged        → re-sync track color with new disabled state (no animation restart)
  //   else (style-only change) → re-sync track color + thumb position with current values
  React.useLayoutEffect(() => {
    const prevValue = prevValueRef.current;
    const prevDisabled = prevDisabledRef.current;
    const isMount = prevValue === null;
    prevValueRef.current = value;
    prevDisabledRef.current = disabled;

    const valueChanged = !isMount && prevValue !== value;
    const disabledChanged = !isMount && prevDisabled !== disabled;

    if (isMount || valueChanged) {
      if (isMount) {
        // Mount: set CURRENT state so first paint is correct.
        updateSwitchUI(
          trackId, thumbId,
          value ? (disabled ? disabledColor : activeColor) : inactiveTrack,
          value ? maxTravel : 0
        );
      } else {
        // State change: set animation START state (opposite of target) synchronously.
        // Overrides _animatedProps before endCommit schedules doRender.
        updateSwitchUI(
          trackId, thumbId,
          value ? inactiveTrack : (disabled ? disabledColor : activeColor),
          value ? 0 : maxTravel
        );
      }

      progress.value = withTiming(value ? 1 : 0, { duration: 200 });
    } else if (disabledChanged) {
      // disabled changed but value didn't — re-sync track color with new disabled state.
      // Do NOT restart withTiming: thumb position stays correct, only track color changes.
      const currentTrack = disabled
        ? disabledColor
        : (value ? activeColor : inactiveTrack);
      // Use progress.value for thumb position so we don't snap if animation is mid-way.
      updateSwitchUI(trackId, thumbId, currentTrack, progress.value * maxTravel);
    } else {
      // Style-only change: activeColor/inactiveTrack/width/height changed, value+disabled same.
      // commitUpdate may have cleared _animatedProps (C++ fix) for the track box if any JSX prop
      // changed (e.g. borderRadius from finalH change). Re-sync to prevent transparent-track frame.
      const currentTrack = disabled
        ? disabledColor
        : (value ? activeColor : inactiveTrack);
      // Use progress.value for thumb position to avoid snapping mid-animation.
      updateSwitchUI(trackId, thumbId, currentTrack, progress.value * maxTravel);
      // Do NOT restart withTiming — thumb continues animating (or is at final position).
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, disabled, trackId, thumbId, activeColor, inactiveTrack, disabledColor,
      maxTravel, updateSwitchUI, progress]);

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
        runOnJS(updateSwitchUI)(
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
      updateSwitchUI,
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