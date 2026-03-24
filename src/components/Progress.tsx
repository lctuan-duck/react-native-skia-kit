import * as React from 'react';
import { useEffect } from 'react';
import { RoundedRect, Circle, Path, LinearGradient, Group, vec } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../core/style.types';
import { resolveSemanticColor } from '../core/colorUtils';

// === Progress Types ===

export type ProgressVariant = 'linear' | 'circular';

export type ProgressStyle = ColorStyle &
  FlexChildStyle & {
    trackColor?: string;
    strokeWidth?: number;
    size?: number;
    width?: number;
    height?: number;
  };

export interface ProgressProps extends WidgetProps {
  /** Variant (default: linear) */
  variant?: ProgressVariant;
  /** 0..1, undefined = indeterminate */
  value?: number;
  /**
   * Colors: accepts SemanticColor | hex string.
   * 1 color → solid fill, >=2 colors → Skia LinearGradient.
   * Default: ['primary']
   */
  colors?: (SemanticColor | string)[];
  /** Style override */
  style?: ProgressStyle;
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
  colors = ['primary'],
  style,
}: ProgressProps) {
  const theme = useTheme();

  // Resolve colors array
  const resolvedColors = colors.map((c) => {
    // Check if it's a semantic color name
    const semanticNames = [
      'primary',
      'secondary',
      'success',
      'info',
      'warning',
      'error',
      'neutral',
    ];
    if (semanticNames.includes(c)) {
      return resolveSemanticColor(c as SemanticColor, theme.colors);
    }
    return c;
  });

  const trackBg = style?.trackColor ?? theme.colors.surfaceVariant;
  const isDeterminate = value != null;

  const width = style?.width ?? 200;
  const height = style?.height ?? 4;
  const size = style?.size ?? 48;
  const strokeW = style?.strokeWidth ?? 4;

  const compW = variant === 'circular' ? size : width;
  const compH = variant === 'circular' ? size : height;

  useWidget({
    type: 'Progress',
    layout: { x, y, width: compW, height: compH },
  });

  // All hooks MUST be called unconditionally
  const linearR = height / 2;
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
    const useGradient = resolvedColors.length >= 2;
    const fillColor = resolvedColors[0] ?? theme.colors.primary;

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
          color={useGradient ? 'transparent' : fillColor}
        >
          {useGradient && (
            <LinearGradient
              start={vec(isDeterminate ? x : x + animX.value, y)}
              end={vec(
                (isDeterminate ? x : x + animX.value) + linearFillWidth,
                y
              )}
              colors={resolvedColors}
            />
          )}
        </RoundedRect>
      </>
    );
  }

  // === CIRCULAR ===
  const cx = x + size / 2;
  const cy = y + size / 2;
  const radius = (size - strokeW) / 2;

  const sweepAngle = isDeterminate
    ? 360 * Math.min(1, Math.max(0, value!))
    : 270;

  const startAngle = -90;
  const arcPath = makeArcPath(cx, cy, radius, startAngle, sweepAngle);
  const circularColor = resolvedColors[0] ?? theme.colors.primary;

  const circularTransform = useDerivedValue(() =>
    isDeterminate
      ? []
      : [
          { translateX: cx },
          { translateY: cy },
          { rotate: (rotation.value * Math.PI) / 180 },
          { translateX: -cx },
          { translateY: -cy },
        ]
  );

  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        color={trackBg}
        style="stroke"
        strokeWidth={strokeW}
      />
      <Group transform={circularTransform}>
        <Path
          path={arcPath}
          color={circularColor}
          style="stroke"
          strokeWidth={strokeW}
          strokeCap="round"
        />
      </Group>
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
