import * as React from 'react';
import { useWidget } from '../hooks/useWidget';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';

export interface SpacerProps {
  /** Size of the spacer (default: 16) */
  size?: number;
  /** Direction: vertical = height, horizontal = width */
  orientation?: 'vertical' | 'horizontal';
  // Layout props injected by parent
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Spacer — empty space with fixed size.
 * Does NOT render any Skia node — exists only for Yoga layout spacing.
 *
 * Tương đương Flutter SizedBox used as spacing / Spacer.
 */
export const Spacer = React.memo(function Spacer({
  size = 16,
  orientation = 'vertical',
}: SpacerProps) {
  const spacerWidth = orientation === 'horizontal' ? size : 0;
  const spacerHeight = orientation === 'vertical' ? size : 0;

  const widgetId = useWidget({
    type: 'Spacer',
    layout: {
      x: 0,
      y: 0,
      width: spacerWidth,
      height: spacerHeight,
    },
  });

  // Register with Yoga so it actually takes space in flex layout
  useNativeYogaLayout(
    widgetId,
    { width: spacerWidth, height: spacerHeight },
    undefined
  );

  return null; // Spacer renders nothing — only takes space in layout
});

(Spacer as any).skiaWidgetType = 'Spacer';
