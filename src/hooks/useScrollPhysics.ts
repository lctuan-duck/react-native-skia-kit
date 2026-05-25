import { useCallback, useEffect } from 'react';
import {
  useSharedValue,
  withDecay,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// ===== Types =====

export type ScrollPhysicsType = 'bouncing' | 'clamping';

export interface ScrollPhysicsConfig {
  viewportSize: number;
  contentSize: number;
}

export interface ScrollPhysicsResult {
  scrollOffset: SharedValue<number>;
  handlePanStart: () => void;
  handlePanUpdate: (translationDelta: number) => void;
  handlePanEnd: (velocity: number) => void;

  scrollTo: (offset: number) => void;
}

/**
 * Scroll physics hook — simulates iOS bouncing or Android clamping scroll behavior.
 * Returns a shared scrollOffset and pan handlers.
 */
export function useScrollPhysics(
  type: ScrollPhysicsType,
  config: ScrollPhysicsConfig
): ScrollPhysicsResult {
  const scrollOffset = useSharedValue(0);
  const maxScroll = useSharedValue(
    Math.max(0, config.contentSize - config.viewportSize)
  );

  // Sync config updates to shared value
  useEffect(() => {
    maxScroll.value = Math.max(0, config.contentSize - config.viewportSize);
  }, [config.contentSize, config.viewportSize, maxScroll]);

  const clamp = useCallback(
    (value: number) => {
      'worklet';
      return Math.max(0, Math.min(maxScroll.value, value));
    },
    [maxScroll]
  );

  const handlePanUpdate = useCallback(
    (translationDelta: number) => {
      'worklet';
      if (type === 'clamping') {
        scrollOffset.value = clamp(scrollOffset.value - translationDelta);
      } else {
        // Bouncing: allow overscroll with rubber-band effect
        const newVal = scrollOffset.value - translationDelta;
        if (newVal < 0 || newVal > maxScroll.value) {
          // Dampen overscroll
          scrollOffset.value = scrollOffset.value - translationDelta * 0.3;
        } else {
          scrollOffset.value = newVal;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, clamp]
  );

  const handlePanEnd = useCallback(
    (velocity: number) => {
      'worklet';
      if (type === 'clamping') {
        // Decay with hard clamping — no overscroll
        scrollOffset.value = withDecay({
          velocity: -velocity,
          clamp: [0, maxScroll.value],
        });
      } else {
        // Bouncing: overscroll is handled during drag (rubber-band in ScrollView.tsx).
        // On release, spring back if we're past the boundary; otherwise decay normally.
        const currentVal = scrollOffset.value;
        if (currentVal < 0) {
          // Snap back — overdamped (damping > 2√(k·m) = 2√150 ≈ 24.5) → zero oscillation
          scrollOffset.value = withSpring(0, { damping: 35, stiffness: 150 });
        } else if (currentVal > maxScroll.value) {
          // Was rubber-banded past bottom — spring back
          scrollOffset.value = withSpring(maxScroll.value, {
            damping: 35,
            stiffness: 150,
          });
        } else {
          // In bounds — normal decay, hard-clamp at boundary (no extra overscroll)
          scrollOffset.value = withDecay({
            velocity: -velocity,
            clamp: [0, maxScroll.value],
          });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, maxScroll]
  );

  const scrollTo = useCallback(
    (offset: number) => {
      scrollOffset.value = withSpring(clamp(offset), {
        damping: 20,
        stiffness: 150,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxScroll]
  );

  const handlePanStart = useCallback(() => {
    cancelAnimation(scrollOffset);
  }, [scrollOffset]);

  return {
    scrollOffset,
    handlePanStart,
    handlePanUpdate,
    handlePanEnd,
    scrollTo,
  };
}
