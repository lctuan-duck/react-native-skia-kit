import * as React from 'react';
import { useEffect } from 'react';
import { RoundedRect, Circle, Path } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export type ProgressVariant = 'linear' | 'circular';

export interface ProgressProps extends WidgetProps {
  variant?: ProgressVariant;
  /** 0..1, undefined = indeterminate */
  value?: number;
  color?: string;
  trackColor?: string;
  /** Linear: track height (default: 4) */
  height?: number;
  borderRadius?: number;
  /** Circular: diameter (default: 48) */
  size?: number;
  /** Circular: stroke width (default: 4) */
  strokeWidth?: number;
}

/**
 * Progress — linear bar or circular spinner.
 * Equivalent to Flutter LinearProgressIndicator / CircularProgressIndicator.
 */
export const Progress = React.memo(function Progress({
  x = 0,
  y = 0,
  variant = 'linear',
  value,
  color,
  trackColor,
  width = 200,
  height = 4,
  borderRadius,
  size = 48,
  strokeWidth = 4,
}: ProgressProps) {
  const theme = useTheme();
  const activeColor = color ?? theme.colors.primary;
  const trackBg = trackColor ?? theme.colors.surfaceVariant;
  const isDeterminate = value != null;

  const compW = variant === 'circular' ? size : width;
  const compH = variant === 'circular' ? size : height;

  useWidget({
    type: 'Progress',
    layout: { x, y, width: compW, height: compH },
  });

  // All hooks MUST be called unconditionally (React rules of hooks)
  const linearR = borderRadius ?? height / 2;
  const linearFillWidth = isDeterminate
    ? width * Math.min(1, Math.max(0, value!))
    : width * 0.4;

  // Linear animation
  const animX = useSharedValue(0);
  useEffect(() => {
    if (variant === 'linear' && !isDeterminate) {
      animX.value = withRepeat(
        withTiming(width - linearFillWidth, { duration: 1000 }),
        -1,
        true
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, isDeterminate, width, linearFillWidth]);

  // Circular animation
  const rotation = useSharedValue(0);
  useEffect(() => {
    if (variant === 'circular' && !isDeterminate) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, isDeterminate]);

  // === LINEAR ===
  if (variant === 'linear') {
    return (
      <>
        <RoundedRect
          x={x}
          y={y}
          width={width}
          height={height}
          r={linearR}
          color={trackBg}
        />
        <RoundedRect
          x={isDeterminate ? x : x + animX.value}
          y={y}
          width={linearFillWidth}
          height={height}
          r={linearR}
          color={activeColor}
        />
      </>
    );
  }

  // === CIRCULAR ===
  const cx = x + size / 2;
  const cy = y + size / 2;
  const radius = (size - strokeWidth) / 2;

  const sweepAngle = isDeterminate
    ? 360 * Math.min(1, Math.max(0, value!))
    : 270;

  const startAngle = -90;
  const arcPath = makeArcPath(cx, cy, radius, startAngle, sweepAngle);

  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        color={trackBg}
        style="stroke"
        strokeWidth={strokeWidth}
      />
      <Path
        path={arcPath}
        color={activeColor}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
      />
    </>
  );
});

function makeArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  sweepDeg: number
): string {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = ((startDeg + sweepDeg) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArc = sweepDeg > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
