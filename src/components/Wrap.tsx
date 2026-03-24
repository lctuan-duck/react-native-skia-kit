import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import type { FlexChildStyle } from '../types/style.types';

// === Wrap Style ===

export type WrapStyle = FlexChildStyle & {
  width?: number;
};

export interface WrapProps extends WidgetProps {
  /** Consolidated style prop */
  style?: WrapStyle;
  /** Horizontal gap between children */
  spacing?: number;
  /** Vertical gap between rows */
  runSpacing?: number;
  /** Horizontal alignment within a row */
  alignment?: 'start' | 'center' | 'end';
  /** Cross-axis alignment */
  crossAxisAlignment?: 'start' | 'center' | 'end';
  /** Children */
  children?: React.ReactNode;
}

/**
 * Wrap — auto-wrapping horizontal flow layout.
 * Tương đương Flutter Wrap.
 *
 * Uses Box with flexDirection="row" + flexWrap="wrap".
 * Yoga handles line-breaking automatically when children exceed width.
 */
export const Wrap = React.memo(function Wrap({
  x = 0,
  y = 0,
  style,
  spacing = 0,
  runSpacing = 0,
  alignment = 'start',
  crossAxisAlignment = 'start',
  children,
}: WrapProps) {
  return (
    <Box
      x={x}
      y={y}
      style={{
        ...style,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing,
        rowGap: runSpacing,
        justifyContent: alignment,
        alignItems: crossAxisAlignment,
      }}
    >
      {children}
    </Box>
  );
});
