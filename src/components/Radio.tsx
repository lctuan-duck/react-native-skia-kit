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
  runOnJS,
} from 'react-native-reanimated';


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

  // WORKLET-SAFE + THREAD-SAFE: dùng GPU transforms thay vì Yoga layout props.
  // dot dùng scale (0→1) thay vì width/height — không trigger Yoga.
  // borderColor/borderRadius/borderWidth là paint props (không phải Yoga) — OK.
  const updateRadioUI = React.useCallback(
    (wId: string, dId: string, borderStr: string, radius: number, bw: number, dotScale: number, dotColorStr: string) => {
      engine.updateAnimatedStyles(wId, { borderColor: parseColor(borderStr), borderRadius: radius, borderWidth: bw });
      // scale thay vì width/height — GPU transform, không trigger Yoga
      engine.updateAnimatedStyles(dId, { scale: dotScale, backgroundColor: parseColor(dotColorStr) });
    },
    [engine]
  );

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

  // Track previous selected to distinguish mount from state changes.
  const prevSelectedRef = React.useRef<boolean | null>(null);

  // useLayoutEffect: fires AFTER commitUpdate but BEFORE endCommit schedules doRender.
  //
  // Flicker root cause (two paths):
  //
  // A. MOUNT FLICKER: C++ BoxNode._scaleX/_scaleY defaults to 1.0f.
  //    On mount with selected=false, without override:
  //      doRender (PATH1a) → rebuildPicture → dotId.paint() reads _scaleX=1 → FULL SIZE! (1-frame flash)
  //    Fix: set _scaleX=0 synchronously on mount → first paint reads scale=0 → dot invisible ✓
  //
  // B. STATE-CHANGE FLICKER: commitUpdate writes FINAL borderColor to _props.
  //    PATH1a reads FINAL state before Reanimated fires → 1-frame flash of target.
  //    Fix: override with START state synchronously before endCommit.
  //
  // GUARD: only fires when 'selected' actually changes or on mount.
  React.useLayoutEffect(() => {
    const prevSelected = prevSelectedRef.current;
    const isMount = prevSelected === null;
    prevSelectedRef.current = selected;

    if (isMount || prevSelected !== selected) {
      if (isMount) {
        // Mount: set CURRENT state so first paint is correct.
        // _scaleX=0 for dot (when unselected) → _animationDirty/markDirty → correct first frame.
        updateRadioUI(
          widgetId, dotId,
          selected ? activeColor : uncheckedBorderColor,
          r, borderWidth, selected ? 1 : 0, dotColor
        );
      } else {
        // State change: set animation START state (opposite of target) synchronously.
        const startP = selected ? 0 : 1;
        const startBorder = selected
          ? (disabled ? disabledBorderColor : uncheckedBorderColor)
          : (disabled ? disabledBorderColor : activeColor);
        updateRadioUI(widgetId, dotId, startBorder, r, borderWidth, startP, dotColor);
      }

      progress.value = withTiming(selected ? 1 : 0, { duration: 150 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, widgetId, dotId, activeColor, disabledBorderColor, uncheckedBorderColor,
      disabled, r, borderWidth, dotColor, updateRadioUI, progress]);

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
        // scale thay vì width/height (Yoga props) — GPU transform, thread-safe
        direct.updateAnimatedStyles(dotId, {
          scale: p,
          backgroundColor: parseColor(dotColor),
        });
      } else {
        runOnJS(updateRadioUI)(
          widgetId,
          dotId,
          currentBorder.toString(),
          r,
          borderWidth,
          p,
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
      dotColor,
      engineId,
      updateRadioUI,
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