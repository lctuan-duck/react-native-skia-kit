import * as React from 'react';
import { Line } from '@shopify/react-native-skia';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../core/style.types';
import { useTheme } from '../hooks/useTheme';
import { resolveSemanticColor } from '../core/colorUtils';

// === Divider Types ===

export type DividerStyle = ColorStyle &
  FlexChildStyle & {
    length?: number;
    thickness?: number;
  };

export interface DividerProps extends WidgetProps {
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: DividerStyle;
}

/**
 * Divider — horizontal or vertical separator line.
 * Equivalent to Flutter Divider / VerticalDivider.
 */
export const Divider = React.memo(function Divider({
  x = 0,
  y = 0,
  orientation = 'horizontal',
  color,
  style,
}: DividerProps) {
  const theme = useTheme();
  const lineColor = style?.backgroundColor
    ?? (color
      ? resolveSemanticColor(color, theme.colors)
      : theme.colors.divider);

  const length = style?.length ?? 300;
  const thickness = style?.thickness ?? 1;

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
