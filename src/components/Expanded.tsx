import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';

export interface ExpandedProps extends WidgetProps {
  /** Flex factor (default: 1) — inherited from WidgetProps but with default */
  children?: React.ReactNode;
}

export interface FlexibleProps extends WidgetProps {
  /** Fit mode: 'tight' fills all space, 'loose' fits content */
  fit?: 'tight' | 'loose';
  /** Children */
  children?: React.ReactNode;
}

/**
 * Expanded — fills remaining space in a Row or Column.
 * Always stretches to fill (fit: 'tight').
 *
 * Tương đương Flutter Expanded.
 */
export const Expanded = React.memo(function Expanded({
  flex = 1,
  children,
  x,
  y,
  width,
  height,
}: ExpandedProps) {
  return (
    <Box
      flex={flex}
      alignSelf="stretch"
      x={x}
      y={y}
      width={width}
      height={height}
    >
      {children}
    </Box>
  );
});

/**
 * Flexible — takes proportional space but doesn't force fill.
 * fit='tight' → stretch (like Expanded), fit='loose' → fit content.
 *
 * Tương đương Flutter Flexible.
 */
export const Flexible = React.memo(function Flexible({
  flex = 1,
  fit = 'loose',
  children,
  x,
  y,
  width,
  height,
}: FlexibleProps) {
  return (
    <Box
      flex={flex}
      alignSelf={fit === 'tight' ? 'stretch' : 'auto'}
      x={x}
      y={y}
      width={width}
      height={height}
    >
      {children}
    </Box>
  );
});
