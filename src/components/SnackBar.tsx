import * as React from 'react';
import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Box } from './Box';
import { Text } from './Text';
import { Expanded } from './Expanded';
import { useTheme } from '../hooks/useTheme';
import { useWidgetId } from '../hooks/useWidgetId';
import { useEngineContext } from '../core/EngineContext';
import type { WidgetProps } from '../types/widget.types';
import type { ColorStyle, FlexChildStyle } from '../types/style.types';

// === SnackBar Types ===

export type SnackBarStyle = ColorStyle &
  FlexChildStyle & {
    textColor?: string;
  };

export interface SnackBarProps extends WidgetProps {
  visible?: boolean;
  message: string;
  action?: { label: string; onPress: () => void };
  duration?: number;
  screenWidth?: number;
  screenHeight?: number;
  /** Style override */
  style?: SnackBarStyle;
  onDismiss?: () => void;
}

// Three render states:
//  - 'idle'      → not rendered (return null)
//  - 'entering'  → rendered, animating in (translateY: 80 → 0)
//  - 'visible'   → fully on screen
//  - 'exiting'   → animating out (translateY: 0 → 80), will flip back to 'idle'
type RenderState = 'idle' | 'entering' | 'visible' | 'exiting';

export const SnackBar = React.memo(function SnackBar({
  visible = false,
  message,
  action,
  duration = 3000,
  style,
  screenWidth = 360,
  screenHeight = 800,
  onDismiss,
}: SnackBarProps) {
  const theme = useTheme();
  const { engine, engineId } = useEngineContext();
  const bgColor = style?.backgroundColor ?? theme.colors.inverseSurface;
  const fgColor = style?.textColor ?? theme.colors.textInverse;

  const widgetId = useWidgetId('SnackBar');

  // Stable ref cho scheduleOnRN fallback — capture engine per-instance
  const updateSnackBarUIRef = React.useRef((wId: string, ty: number) => {
    engine.updateAnimatedStyles(wId, { translateY: ty });
    (global as any).skiaKitScrollRedraw?.();
  });
  updateSnackBarUIRef.current = (wId, ty) => {
    engine.updateAnimatedStyles(wId, { translateY: ty });
    (global as any).skiaKitScrollRedraw?.();
  };

  const translateY = useSharedValue(80);

  // SN1 fix: apply translateY to C++ node via worklet reaction
  useAnimatedReaction(
    () => translateY.value,
    (ty) => {
      'worklet';
      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        direct.updateAnimatedStyles(widgetId, { translateY: ty });
      } else {
        scheduleOnRN(updateSnackBarUIRef.current, widgetId, ty);
      }
    },
    [widgetId, engineId]
  );

  // Dismiss-state machine — only render DOM node during enter/visible/exit phases.
  // This ensures the C++ node EXISTS when the first animation fires.
  const [renderState, setRenderState] = React.useState<RenderState>('idle');
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // BUG-4 Fix: dùng renderStateRef để tránh stale closure trong useEffect.
  // visible có thể toggle nhanh trước khi renderState kịp cập nhật,
  // renderStateRef.current luôn trỏ đến giá trị mới nhất — không cần trong deps.
  const renderStateRef = React.useRef(renderState);
  renderStateRef.current = renderState;

  useEffect(() => {
    if (visible) {
      clearTimer();
      // First mount this component, THEN animate in (useLayoutEffect below handles
      // the animation start after the C++ node is registered)
      setRenderState('entering');
    } else {
      // BUG-4 Fix: đọc renderStateRef.current thay vì renderState để luôn lấy giá trị hiện tại
      const currentState = renderStateRef.current;
      if (currentState === 'visible' || currentState === 'entering') {
        clearTimer();
        setRenderState('exiting');
        translateY.value = withTiming(80, { duration: 220 });
        // SN2 fix: wait for animation to finish before removing from tree
        timerRef.current = setTimeout(() => setRenderState('idle'), 240);
      }
    }
    return clearTimer;
  }, [visible]); // renderStateRef không cần trong deps — là ref nên luôn fresh

  // Start slide-in AFTER C++ node is in the tree (useLayoutEffect = synchronous after DOM update)
  React.useLayoutEffect(() => {
    if (renderState === 'entering') {
      // Node is now in C++ tree → safe to animate
      translateY.value = 80; // reset position
      // Small delay to ensure C++ node is fully registered
      timerRef.current = setTimeout(() => {
        translateY.value = withTiming(0, { duration: 220 });
        setRenderState('visible');

        // Auto-dismiss after duration
        timerRef.current = setTimeout(() => {
          setRenderState('exiting');
          translateY.value = withTiming(80, { duration: 220 });
          timerRef.current = setTimeout(() => {
            setRenderState('idle');
            onDismiss?.();
          }, 240);
        }, duration);
      }, 16); // one frame delay
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderState]);

  if (renderState === 'idle') return null;

  return (
    <Box
      id={widgetId}
      style={{
        position: 'absolute',
        left: 8,
        top: screenHeight - 72,
        width: screenWidth - 16,
        height: 52,
        borderRadius: 8,
        backgroundColor: bgColor,
        elevation: 8,
        flexDirection: 'row',
        alignItems: 'center',
        padding: [0, 16, 0, 16],
      }}
    >
      <Expanded>
        <Text text={message} style={{ fontSize: 14, color: fgColor }} />
      </Expanded>
      {action && (
        <Box
          hitTestBehavior="opaque"
          onPress={action.onPress}
          style={{ padding: [0, 4, 0, 12] }}
        >
          <Text
            text={action.label}
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: theme.colors.primary,
            }}
          />
        </Box>
      )}
    </Box>
  );
});

(SnackBar as any).skiaWidgetType = 'SnackBar';