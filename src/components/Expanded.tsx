import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';
import type { FlexChildStyle } from '../core/style.types';

// === Expanded Style ===

export type ExpandedStyle = FlexChildStyle;

export interface ExpandedProps extends WidgetProps {
  /** Consolidated style prop */
  style?: ExpandedStyle;
  /** Children */
  children?: React.ReactNode;
}

export interface FlexibleProps extends WidgetProps {
  /** Fit mode: 'tight' fills all space, 'loose' fits content */
  fit?: 'tight' | 'loose';
  /** Consolidated style prop */
  style?: ExpandedStyle;
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
  style,
  children,
  x,
  y,
}: ExpandedProps) {
  return (
    <Box
      x={x}
      y={y}
      style={{
        ...style,
        flex: style?.flex ?? 1,
        alignSelf: 'stretch',
        width: style?.flexBasis as number | undefined,
      }}
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
  fit = 'loose',
  style,
  children,
  x,
  y,
}: FlexibleProps) {
  return (
    <Box
      x={x}
      y={y}
      style={{
        ...style,
        flex: style?.flex ?? 1,
        alignSelf: fit === 'tight' ? 'stretch' : 'auto',
      }}
    >
      {children}
    </Box>
  );
});
