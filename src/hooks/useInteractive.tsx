import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { uiEngine } from '../core/GlobalEngine';

/** Bounds của một Box widget — dùng bởi renderOverlay (backward compat) */
export interface BoxBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// === Types ===

export type InteractiveMode = 'ripple' | 'bounce' | 'opacity' | 'none';

export interface UseInteractiveOptions {
  /** Base opacity — rest value for opacity animation (default: 1) */
  baseOpacity?: number;
  /** Background color — used to auto-compute ripple contrast color */
  bgColor?: string;
  /** Manual ripple color override */
  rippleColor?: string;
}

export interface UseInteractiveResult {
  /** Pass to Box onPressIn */
  onPressIn: (localX?: number, localY?: number) => void;
  /** Pass to Box onPressOut */
  onPressOut: () => void;
  /** Call in onPress / onPanStart to restore visual state */
  restoreInteraction: () => void;
  /**
   * Dummy renderOverlay for backward compatibility with v1 API
   * V2 architecture handles opacity directly on the C++ RenderNode.
   */
  renderOverlay: (bounds: BoxBounds) => null;
}

// No-op result for when Reanimated is unavailable (secondary renderer context)
const noopResult: UseInteractiveResult = {
  onPressIn: () => {},
  onPressOut: () => {},
  restoreInteraction: () => {},
  renderOverlay: () => null,
};

/**
 * useInteractive — encapsulates interactive animation effects.
 *
 * SAFE trong secondary renderer (SkiaKit Reconciler): nếu Reanimated hooks fail
 * (useSharedValue throws trong non-primary renderer context), trả về no-op callbacks
 * thay vì crash toàn bộ component tree.
 */
export function useInteractive(
  widgetId: string,
  mode: InteractiveMode,
  options?: UseInteractiveOptions
): UseInteractiveResult {
  const baseOpacity = options?.baseOpacity ?? 1;
  // Track if component is still mounted (for updateStyle safety)
  const _widgetIdRef = useRef(widgetId);
  _widgetIdRef.current = widgetId;

  // Reanimated hooks — có thể throw trong secondary renderer context.
  // Nếu throw, early-return no-op result.
  let pressOpacity: ReturnType<typeof useSharedValue<number>>;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pressOpacity = useSharedValue(baseOpacity);
  } catch {
    // Secondary renderer: Reanimated dispatcher unavailable → return safe no-ops
    return noopResult;
  }

  const updateStyle = useCallback((opacity: number) => {
    if (uiEngine && widgetId) {
      uiEngine.updateRenderNodeStyle(widgetId, opacity);
    }
  }, [widgetId]);

  // Sync to C++ via runOnJS (uiEngine is a host object, not shareable to UI thread)
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedReaction(
      () => pressOpacity.value,
      (opacity) => {
        'worklet';
        runOnJS(updateStyle)(opacity);
      }
    );
  } catch {
    // Ignore in secondary renderer
  }

  // === Restore visual state ===
  const restoreInteraction = useCallback(() => {
    if (mode !== 'none') {
      pressOpacity.value = withTiming(baseOpacity, { duration: 200 });
    }
  }, [mode, pressOpacity, baseOpacity]);

  // === Press handlers ===
  const onPressIn = useCallback(
    (_localX?: number, _localY?: number) => {
      if (mode !== 'none') {
        pressOpacity.value = withTiming(0.6, { duration: 100 });
      }
    },
    [mode, pressOpacity]
  );

  const onPressOut = useCallback(() => {
    restoreInteraction();
  }, [restoreInteraction]);

  // === Dummy render overlay function ===
  const renderOverlay = useCallback((_bounds: BoxBounds) => null, []);

  return {
    renderOverlay,
    onPressIn,
    onPressOut,
    restoreInteraction,
  };
}
