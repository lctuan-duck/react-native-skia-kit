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
import { useEngine } from '../core/EngineContext';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  interpolateColor,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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

const updateCheckboxUI = (
  widgetId: string,
  iconId: string,
  currentBgStr: string,
  currentBorderStr: string,
  borderRadius: number,
  borderWidth: number,
  opacity: number
) => {
    engine.updateAnimatedStyles(widgetId, {
    backgroundColor: parseColor(currentBgStr),
    borderColor: parseColor(currentBorderStr),
    borderRadius: borderRadius,
    borderWidth: borderWidth,
  });

  // updateAnimatedStyles: set _opacity trực tiếp trên RenderNode.
  engine.updateAnimatedStyles(iconId, { opacity });
  (global as any).skiaKitScrollRedraw?.();
};

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
  const engine = useEngine();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);

  const uncheckedBorderColor = theme.colors.outline;
  const disabledBorderColor = theme.colors.textDisabled;

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

  React.useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, { duration: 150 });
  }, [checked, progress]);

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

      const direct = (global as any).updateAnimatedStylesDirect;
      if (typeof direct === 'function') {
        // Direct worklet → C++ — parse color strings to numeric SkColor
        direct(widgetId, {
          backgroundColor: parseColor(currentBg),
          borderColor: parseColor(currentBorder),
          borderRadius: borderRadius,
          borderWidth: borderWidth,
        });
        // Icon opacity via direct (opacity is in NativeAnimatedStyle)
        direct(iconId, { opacity: p });
        (global as any).skiaKitScrollRedraw?.();
      } else {
        scheduleOnRN(
          updateCheckboxUI,
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