import { useCallback } from 'react';
import {
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// ===== Types =====

export interface AnimationConfig {
  duration?: number;
  curve?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';
  delay?: number;
}

export interface AnimationController {
  value: SharedValue<number>;
  isAnimating: SharedValue<boolean>;
  status: SharedValue<'idle' | 'forward' | 'reverse'>;

  forward: (config?: AnimationConfig) => void;
  reverse: (config?: AnimationConfig) => void;
  animateTo: (target: number, config?: AnimationConfig) => void;
  reset: () => void;
  repeat: (
    config?: AnimationConfig & { count?: number; reverse?: boolean }
  ) => void;
  stop: () => void;
}

const EASING_MAP = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
};

/**
 * Animation controller hook — equivalent to Flutter AnimationController.
 * Wraps Reanimated shared values with forward/reverse/repeat/stop API.
 */
export function useAnimation(initialValue = 0): AnimationController {
  const value = useSharedValue(initialValue);
  const isAnimating = useSharedValue(false);
  const status = useSharedValue<'idle' | 'forward' | 'reverse'>('idle');

  const animate = useCallback(
    (
      target: number,
      config: AnimationConfig = {},
      direction: 'forward' | 'reverse' = 'forward'
    ) => {
      const {
        duration = 300,
        curve = 'easeInOut',
        delay: delayMs = 0,
      } = config;

      isAnimating.value = true;
      status.value = direction;

      const onFinish = (finished?: boolean) => {
        'worklet';
        if (finished) {
          isAnimating.value = false;
          status.value = 'idle';
        }
      };

      let anim;
      if (curve === 'spring') {
        anim = withSpring(target, { damping: 15, stiffness: 150 }, onFinish);
      } else {
        const easing = EASING_MAP[curve] ?? EASING_MAP.easeInOut;
        anim = withTiming(target, { duration, easing }, onFinish);
      }

      value.value = delayMs > 0 ? withDelay(delayMs, anim) : anim;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    value,
    isAnimating,
    status,

    forward: (config) => animate(1, config, 'forward'),
    reverse: (config) => animate(0, config, 'reverse'),
    animateTo: (target, config) =>
      animate(target, config, target > value.value ? 'forward' : 'reverse'),

    reset: () => {
      cancelAnimation(value);
      value.value = initialValue;
      isAnimating.value = false;
      status.value = 'idle';
    },

    repeat: (config = {}) => {
      const {
        count = -1,
        reverse: rev = true,
        duration = 300,
        curve = 'easeInOut',
      } = config;
      isAnimating.value = true;
      status.value = 'forward';
      const easing =
        EASING_MAP[curve as keyof typeof EASING_MAP] ?? EASING_MAP.easeInOut;
      value.value = withRepeat(withTiming(1, { duration, easing }), count, rev);
    },

    stop: () => {
      cancelAnimation(value);
      isAnimating.value = false;
      status.value = 'idle';
    },
  };
}
