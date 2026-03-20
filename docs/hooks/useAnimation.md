# useAnimation Hook

## Mục đích
- Cung cấp API chuẩn hóa cho animation, tương đương Flutter `AnimationController`.
- Wrap `react-native-reanimated` SharedValues thành interface quen thuộc.
- Hỗ trợ: animate to value, repeat, reverse, sequence, delay.

## Flutter tương đương
- `AnimationController`, `Tween`, `CurvedAnimation`

## API

```ts
interface AnimationConfig {
  duration?: number;        // default: 300ms
  curve?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring'; // default: 'easeInOut'
  delay?: number;           // default: 0
}

interface AnimationController {
  value: SharedValue<number>;  // 0..1 (hoặc custom range)

  // Core
  forward: (config?: AnimationConfig) => void;   // 0 → 1
  reverse: (config?: AnimationConfig) => void;    // 1 → 0
  animateTo: (target: number, config?: AnimationConfig) => void;
  reset: () => void;                              // snap to 0

  // Repeat
  repeat: (config?: AnimationConfig & { count?: number; reverse?: boolean }) => void;
  stop: () => void;

  // Status
  isAnimating: SharedValue<boolean>;
  status: SharedValue<'idle' | 'forward' | 'reverse'>;
}

function useAnimation(initialValue?: number): AnimationController;
```

## Implementation

```ts
import { useSharedValue, withTiming, withSpring, withRepeat, withDelay, 
         withSequence, Easing, cancelAnimation, runOnJS } from 'react-native-reanimated';
import { useCallback, useRef } from 'react';

const EASING_MAP = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
};

export function useAnimation(initialValue = 0): AnimationController {
  const value = useSharedValue(initialValue);
  const isAnimating = useSharedValue(false);
  const status = useSharedValue<'idle' | 'forward' | 'reverse'>('idle');

  const animate = useCallback((
    target: number,
    config: AnimationConfig = {},
    direction: 'forward' | 'reverse' = 'forward',
  ) => {
    const { duration = 300, curve = 'easeInOut', delay: delayMs = 0 } = config;

    isAnimating.value = true;
    status.value = direction;

    const animation = curve === 'spring'
      ? withSpring(target, { damping: 15, stiffness: 150 })
      : withTiming(target, { duration, easing: EASING_MAP[curve] ?? EASING_MAP.easeInOut });

    const withCallback = withTiming(target, { duration, easing: EASING_MAP[curve] }, (finished) => {
      if (finished) {
        isAnimating.value = false;
        status.value = 'idle';
      }
    });

    value.value = delayMs > 0
      ? withDelay(delayMs, curve === 'spring' ? animation : withCallback)
      : (curve === 'spring' ? animation : withCallback);
  }, []);

  return {
    value,
    isAnimating,
    status,

    forward: (config) => animate(1, config, 'forward'),
    reverse: (config) => animate(0, config, 'reverse'),
    animateTo: (target, config) => animate(target, config, target > value.value ? 'forward' : 'reverse'),

    reset: () => {
      cancelAnimation(value);
      value.value = initialValue;
      isAnimating.value = false;
      status.value = 'idle';
    },

    repeat: (config = {}) => {
      const { count = -1, reverse: rev = true, duration = 300, curve = 'easeInOut' } = config;
      isAnimating.value = true;
      status.value = 'forward';
      value.value = withRepeat(
        withTiming(1, { duration, easing: EASING_MAP[curve] }),
        count,  // -1 = infinite
        rev,    // true = auto-reverse
      );
    },

    stop: () => {
      cancelAnimation(value);
      isAnimating.value = false;
      status.value = 'idle';
    },
  };
}
```

## Cách dùng

### Fade In
```tsx
function FadeInBox() {
  const anim = useAnimation(0);

  useEffect(() => { anim.forward(); }, []);

  return (
    <Group opacity={anim.value}>
      <Box x={16} y={100} width={200} height={100} color={theme.colors.primary} />
    </Group>
  );
}
```

### Button press scale
```tsx
function AnimatedButton({ text, onPress }) {
  const scale = useAnimation(1);

  const handlePress = () => {
    scale.animateTo(0.95, { duration: 100 });
    setTimeout(() => {
      scale.animateTo(1, { duration: 100, curve: 'spring' });
      onPress?.();
    }, 100);
  };

  return (
    <Group transform={[{ scale: scale.value }]}>
      <Button text={text} onPress={handlePress} />
    </Group>
  );
}
```

### Infinite pulse
```tsx
function PulsingDot() {
  const pulse = useAnimation(0.5);

  useEffect(() => {
    pulse.repeat({ duration: 1000, reverse: true });
    return () => pulse.stop();
  }, []);

  return <Circle cx={180} cy={400} r={20} opacity={pulse.value} color={theme.colors.error} />;
}
```

### Spring animation
```tsx
const slide = useAnimation(0);
slide.animateTo(1, { curve: 'spring' }); // bouncy spring
```

### Staggered animations
```tsx
const items = [useAnimation(0), useAnimation(0), useAnimation(0)];

useEffect(() => {
  items.forEach((anim, i) => {
    anim.forward({ delay: i * 100, duration: 400 });
  });
}, []);

// Mỗi item fade in cách nhau 100ms
```

## Flutter Comparison

| Flutter | Skia Kit |
|---------|----------|
| `AnimationController(duration: 300ms)` | `useAnimation(0)` |
| `controller.forward()` | `anim.forward()` |
| `controller.reverse()` | `anim.reverse()` |
| `controller.repeat(reverse: true)` | `anim.repeat({ reverse: true })` |
| `controller.animateTo(0.5)` | `anim.animateTo(0.5)` |
| `controller.reset()` | `anim.reset()` |
| `controller.stop()` | `anim.stop()` |
| `CurvedAnimation(curve: Curves.easeIn)` | `{ curve: 'easeIn' }` |
| `controller.value` | `anim.value` (SharedValue) |
| `controller.isAnimating` | `anim.isAnimating` |

## Links
- Dependencies: `react-native-reanimated`
- Used by: [Button.md](../components/Button.md), [Progress.md](../components/Progress.md), [Switch.md](../components/Switch.md)
- Phase: [phase8_animation.md](../plans/phase8_animation.md)
