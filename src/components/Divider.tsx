import * as React from 'react';
import { Line } from '@shopify/react-native-skia';
import type { WidgetProps } from '../core/types';
import { useTheme } from '../hooks/useTheme';

export interface DividerProps extends WidgetProps {
  length?: number;
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
}

/**
 * Divider — horizontal or vertical separator line.
 * Equivalent to Flutter Divider / VerticalDivider.
 */
export const Divider = React.memo(function Divider({
  x = 0,
  y = 0,
  length = 300,
  orientation = 'horizontal',
  thickness = 1,
  color,
}: DividerProps) {
  const theme = useTheme();
  const lineColor = color ?? theme.colors.divider;

  if (orientation === 'horizontal') {
    return (
      <Line
        p1={{ x, y }}
        p2={{ x: x + length, y }}
        strokeWidth={thickness}
        color={lineColor}
      />
    );
  }
  return (
    <Line
      p1={{ x, y }}
      p2={{ x, y: y + length }}
      strokeWidth={thickness}
      color={lineColor}
    />
  );
});
