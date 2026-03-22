import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';

export interface WrapProps extends WidgetProps {
  /** Width — REQUIRED (needed to know when to break line) */
  width: number;
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
  width,
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
      width={width}
      flexDirection="row"
      flexWrap="wrap"
      gap={spacing}
      rowGap={runSpacing}
      justifyContent={alignment}
      alignItems={crossAxisAlignment}
    >
      {children}
    </Box>
  );
});
