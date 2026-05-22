import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
  LayoutStyle,
} from '../types/style.types';
import { useTheme } from '../hooks/useTheme';
import { resolveSemanticColor } from '../core/colorUtils';

// === Divider Types ===

export type DividerStyle = ColorStyle &
  FlexChildStyle &
  LayoutStyle & {
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
  orientation = 'horizontal',
  color,
  style,
}: DividerProps) {
  const theme = useTheme();
  const lineColor =
    style?.backgroundColor ??
    (color ? resolveSemanticColor(color, theme.colors) : theme.colors.divider);

  const length = style?.length ?? style?.width;
  const thickness = style?.thickness ?? 1;

  // Yoga layout dimensions: horizontal divider stretches width, vertical stretches height
  const yogaWidth = orientation === 'horizontal' ? (length ?? '100%') : thickness;
  const yogaHeight = orientation === 'vertical' ? (length ?? '100%') : thickness;

  
  

  
  

  if (orientation === 'horizontal') {
    return (
      <Box
        style={{
          width: yogaWidth,
          height: thickness,
          backgroundColor: lineColor,
        }}
      />
    );
  }
  return (
    <Box
      style={{
        width: thickness,
        height: yogaHeight,
        backgroundColor: lineColor,
      }}
    />
  );
});

(Divider as any).skiaWidgetType = 'Divider';
