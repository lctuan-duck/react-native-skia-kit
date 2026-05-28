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
import { resolveSemanticColor, parseColor } from '../utils/color';
import { useEngineContext } from '../core/EngineContext';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';


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
  const { engine, engineId } = useEngineContext();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);

  const uncheckedBorderColor = theme.colors.outline;
  const disabledBorderColor = theme.colors.textDisabled;

  // WORKLET-SAFE: useCallback + runOnJS thay vì mutable ref
  const updateCheckboxUI = React.useCallback(
    (wId: string, iId: string, bgStr: string, borderStr: string, br: number, bw: number, opacity: number) => {
      engine.updateAnimatedStyles(wId, {
        backgroundColor: parseColor(bgStr),
        borderColor: parseColor(borderStr),
        borderRadius: br,
        borderWidth: bw,
      });
      engine.updateAnimatedStyles(iId, { opacity });
    },
    [engine]
  );

  const targetBorderColor = disabled
    ? disabledBorderColor
    : checked
    ? activeColor
    : uncheckedBorderColor;

  const targetBgColor = checked
    ? disabled
      ? disabledBorderColor
      : activeColor
    : 'transparent';

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!checked);
    onPress?.();
  };

  const widgetId = useWidgetId('Checkbox');
  const iconId = useWidgetId('CheckboxIcon');

  const borderRadius = style?.borderRadius ?? 4;
  const borderWidth = style?.borderWidth ?? 2;

  const progress = useSharedValue(checked ? 1 : 0);

  // Track previous checked to distinguish mount from state changes.
  const prevCheckedRef = React.useRef<boolean | null>(null);

  // useLayoutEffect: fires AFTER commitUpdate but BEFORE endCommit schedules doRender.
  //
  // Flicker root cause (two paths):
  //
  // A. MOUNT FLICKER: C++ IconNode._opacity defaults to 1.0f.
  //    On mount with checked=false, without override:
  //      doRender (PATH1a) → rebuildPicture → iconId.paint() reads _opacity=1.0f → VISIBLE! (1-frame flash)
  //    Fix: set _animatedProps synchronously on mount → _animationDirty=true → PATH1+anim
  //         → direct paint reads _opacity=0 → icon invisible from frame 0 ✓
  //
  // B. STATE-CHANGE FLICKER: commitUpdate writes FINAL state to _props.
  //    withTiming evaluates to same p=0 on first Reanimated frame → useAnimatedReaction NOT fired.
  //    → PATH1a → rebuildPicture reads FINAL state → 1-frame flash of target before animation starts.
  //    Fix: override committed FINAL state with START state synchronously before endCommit.
  //
  // GUARD: only fires when 'checked' actually changes or on mount.
  //   Prevents spurious start-state overrides when other deps (activeColor, etc.) change.
  React.useLayoutEffect(() => {
    const prevChecked = prevCheckedRef.current;
    const isMount = prevChecked === null;
    prevCheckedRef.current = checked;

    if (isMount || prevChecked !== checked) {
      if (isMount) {
        // Mount: set CURRENT state (not opposite) so first paint is correct.
        // This sets _animationDirty=true (icon opacity) → PATH1+anim on first doRender
        // → direct paint with _opacity=(checked?1:0) instead of the default 1.0f.
        updateCheckboxUI(
          widgetId, iconId,
          checked ? activeColor : 'transparent',
          checked ? activeColor : uncheckedBorderColor,
          borderRadius, borderWidth, checked ? 1 : 0
        );
      } else {
        // State change: set animation START state (opposite of target) synchronously.
        // Overrides commitUpdate's FINAL state before endCommit schedules doRender.
        const startP = checked ? 0 : 1;
        updateCheckboxUI(
          widgetId, iconId,
          checked ? 'transparent' : activeColor,
          checked ? uncheckedBorderColor : activeColor,
          borderRadius, borderWidth, startP
        );
      }

      progress.value = withTiming(checked ? 1 : 0, { duration: 150 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, widgetId, iconId, activeColor, uncheckedBorderColor, borderRadius, borderWidth, updateCheckboxUI, progress]);

  useAnimatedReaction(
    () => progress.value,
    (p) => {
      'worklet';
      const currentBg = interpolateColor(
        p,
        [0, 1],
        ['transparent', disabled ? disabledBorderColor : activeColor]
      );
      const currentBorder = interpolateColor(
        p,
        [0, 1],
        [
          disabled ? disabledBorderColor : uncheckedBorderColor,
          disabled ? disabledBorderColor : activeColor,
        ]
      );

      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        // Direct worklet → C++ — parse color strings to numeric SkColor
        direct.updateAnimatedStyles(widgetId, {
          backgroundColor: parseColor(currentBg),
          borderColor: parseColor(currentBorder),
          borderRadius: borderRadius,
          borderWidth: borderWidth,
        });
        // Icon opacity via direct (opacity is in NativeAnimatedStyle)
        direct.updateAnimatedStyles(iconId, { opacity: p });
        (global as any).skiaKitScrollRedraw?.();
      } else {
        runOnJS(updateCheckboxUI)(
          widgetId,
          iconId,
          currentBg.toString(),
          currentBorder.toString(),
          borderRadius,
          borderWidth,
          p
        );
      }
    },
    [
      activeColor,
      disabledBorderColor,
      uncheckedBorderColor,
      disabled,
      widgetId,
      iconId,
      borderRadius,
      borderWidth,
      engineId,
      updateCheckboxUI,
    ]
  );

  return (
    <Box
      id={widgetId}
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        backgroundColor: targetBgColor,
        borderWidth: borderWidth,
        borderColor: targetBorderColor,
        // disabled opacity applied only on container — NOT on icon (icon opacity is animated separately)
        opacity: disabled ? 0.5 : 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      hitTestBehavior="translucent"
      onPress={handlePress}
    >
      <Icon
        id={iconId}
        name="check"
        size={size * 0.8}
        color="white"
        // Initial opacity driven by animated reaction — no static value here
        // to avoid conflicting with updateRenderNodeStyle animation
      />
    </Box>
  );
});

(Checkbox as any).skiaWidgetType = 'Checkbox';