import { useCallback, useEffect } from 'react';
import { useSharedValue, withDecay, withSpring } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// ===== Types =====

export type ScrollPhysicsType = 'bouncing' | 'clamping';

export interface ScrollPhysicsConfig {
  viewportSize: number;
  contentSize: number;
}

export interface ScrollPhysicsResult {
  scrollOffset: SharedValue<number>;
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
  const maxScroll = useSharedValue(Math.max(0, config.contentSize - config.viewportSize));

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
        // Decay with clamping
        scrollOffset.value = withDecay({
          velocity: -velocity,
          clamp: [0, maxScroll.value],
        });
      } else {
        // Bouncing: decay then spring back if overscrolled
        const currentVal = scrollOffset.value;
        if (currentVal < 0) {
          scrollOffset.value = withSpring(0, {
            damping: 20,
            stiffness: 200,
          });
        } else if (currentVal > maxScroll.value) {
          scrollOffset.value = withSpring(maxScroll.value, {
            damping: 20,
            stiffness: 200,
          });
        } else {
          scrollOffset.value = withDecay({
            velocity: -velocity,
            clamp: [0, maxScroll.value],
            rubberBandEffect: true,
            rubberBandFactor: 0.6,
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

  return {
    scrollOffset,
    handlePanUpdate,
    handlePanEnd,
    scrollTo,
  };
}
