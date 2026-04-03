import React, { useEffect } from 'react';
import { Circle, Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export interface RippleEffectProps {
  x: number;
  y: number;
  boundsWidth: number;
  boundsHeight: number;
  color: string;
  onComplete: () => void;
}

/**
 * A single Ripple animation in Skia.
 * It expands from (x, y) to cover the bounds.
 */
export const RippleEffect = React.memo(function RippleEffect({
  x,
  y,
  boundsWidth,
  boundsHeight,
  color,
  onComplete,
}: RippleEffectProps) {
  // Bán kính cuối cùng đủ để phủ toàn bộ khối hình chữ nhật lớn nhất
  const maxRadius = Math.sqrt(
    Math.pow(Math.max(x, boundsWidth - x), 2) +
      Math.pow(Math.max(y, boundsHeight - y), 2)
  );

  const radius = useSharedValue(0);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // 1. Phóng to bán kính Ripple cực nhanh
    radius.value = withTiming(maxRadius, {
      duration: 350,
      easing: Easing.out(Easing.ease),
    });

    // 2. Mờ dần
    opacity.value = withTiming(
      0,
      {
        duration: 400,
        easing: Easing.in(Easing.linear),
      },
      (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      }
    );
  }, [maxRadius, radius, opacity, onComplete]);

  return (
    <Group opacity={opacity}>
      <Circle cx={x} cy={y} r={radius} color={color} />
    </Group>
  );
});
