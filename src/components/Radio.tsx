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
import { resolveSemanticColor, parseColor } from '../utils/color';
import { useEngineContext } from '../core/EngineContext';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  interpolateColor,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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
  const { engine, engineId } = useEngineContext();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
  const r = size / 2;

  const uncheckedBorderColor = theme.colors.outline;
  const disabledBorderColor = theme.colors.textDisabled;

  // Stable ref cho scheduleOnRN fallback — capture engine per-instance
  const updateRadioUIRef = React.useRef(
    (wId: string, dId: string, borderStr: string, dotSize: number, radius: number, bw: number, dotColorStr: string) => {
      engine.updateAnimatedStyles(wId, { borderColor: parseColor(borderStr), borderRadius: radius, borderWidth: bw });
      engine.updateAnimatedStyles(dId, { width: dotSize, height: dotSize, backgroundColor: parseColor(dotColorStr), borderRadius: dotSize / 2 });
      (global as any).skiaKitScrollRedraw?.();
    }
  );
  updateRadioUIRef.current = (wId, dId, borderStr, dotSize, radius, bw, dotColorStr) => {
    engine.updateAnimatedStyles(wId, { borderColor: parseColor(borderStr), borderRadius: radius, borderWidth: bw });
    engine.updateAnimatedStyles(dId, { width: dotSize, height: dotSize, backgroundColor: parseColor(dotColorStr), borderRadius: dotSize / 2 });
    (global as any).skiaKitScrollRedraw?.();
  };


  const targetBorderColor = disabled
    ? disabledBorderColor
    : selected
    ? activeColor
    : uncheckedBorderColor;

  const dotColor = disabled ? disabledBorderColor : activeColor;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!selected);
    onPress?.();
  };

  const widgetId = useWidgetId('Radio');
  const dotId = useWidgetId('RadioDot');

  const borderWidth = style?.borderWidth ?? 2;
  const maxDotSize = size * 0.5;

  const progress = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected, progress]);

  // Use Worklet to directly update engine for smooth 60fps animations
  useAnimatedReaction(
    () => progress.value,
    (p) => {
      'worklet';
      const currentBorder = interpolateColor(
        p,
        [0, 1],
        [
          disabled ? disabledBorderColor : uncheckedBorderColor,
          disabled ? disabledBorderColor : activeColor,
        ]
      );

      const currentDotSize = p * maxDotSize;

      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        direct.updateAnimatedStyles(widgetId, {
          borderColor: parseColor(currentBorder),
          borderRadius: r,
          borderWidth: borderWidth,
        });
        direct.updateAnimatedStyles(dotId, {
          width: currentDotSize,
          height: currentDotSize,
          backgroundColor: parseColor(dotColor),
          borderRadius: currentDotSize / 2,
        });
      } else {
        scheduleOnRN(
          updateRadioUIRef.current,
          widgetId,
          dotId,
          currentBorder.toString(),
          currentDotSize,
          r,
          borderWidth,
          dotColor
        );
      }
    },
    [
      activeColor,
      disabledBorderColor,
      uncheckedBorderColor,
      disabled,
      widgetId,
      dotId,
      r,
      borderWidth,
      maxDotSize,
      dotColor,
      engineId,
    ]
  );

  return (
    <Box
      id={widgetId}
      style={{
        width: size,
        height: size,
        backgroundColor: 'transparent',
        borderRadius: r,
        borderWidth: borderWidth,
        borderColor: targetBorderColor,
        opacity: disabled ? 0.5 : 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      hitTestBehavior="translucent"
      onPress={handlePress}
    >
      <Box
        id={dotId}
        style={{
          width: maxDotSize,
          height: maxDotSize,
          borderRadius: maxDotSize / 2,
          backgroundColor: dotColor,
        }}
      />
    </Box>
  );
});

(Radio as any).skiaWidgetType = 'Radio';