import * as React from 'react';
import { Line } from '@shopify/react-native-skia';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
  LayoutStyle,
} from '../types/style.types';
import { useTheme } from '../hooks/useTheme';
import { resolveSemanticColor } from '../core/colorUtils';
import { useWidgetId } from '../hooks/useWidgetId';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';

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

  const widgetId = useWidgetId('Divider');

  const layoutResult = useNativeYogaLayout(
    widgetId,
    { ...style, width: yogaWidth, height: yogaHeight },
    undefined
  );

  const finalX = layoutResult?.x ?? 0;
  const finalY = layoutResult?.y ?? 0;

  const finalW = layoutResult?.width ?? (typeof yogaWidth === 'number' ? yogaWidth : 300);
  const finalH = layoutResult?.height ?? (typeof yogaHeight === 'number' ? yogaHeight : 300);

  if (orientation === 'horizontal') {
    return (
      <Line
        p1={{ x: finalX, y: finalY }}
        p2={{ x: finalX + finalW, y: finalY }}
        strokeWidth={thickness}
        color={lineColor}
      />
    );
  }
  return (
    <Line
      p1={{ x: finalX, y: finalY }}
      p2={{ x: finalX, y: finalY + finalH }}
      strokeWidth={thickness}
      color={lineColor}
    />
  );
});

(Divider as any).skiaWidgetType = 'Divider';
