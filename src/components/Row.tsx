import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';

export interface RowProps extends WidgetProps {
  mainAxisAlignment?:
    | 'start'
    | 'center'
    | 'end'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly';
  crossAxisAlignment?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
  padding?: number | [number, number, number, number];
  color?: string;
  borderRadius?: number;
  children?: React.ReactNode;
}

/**
 * Row — arranges children horizontally.
 * Thin wrapper over Box with flexDirection="row".
 * Children do NOT need x/y — Yoga injects them automatically.
 */
export const Row = React.memo(function Row({
  x = 0,
  y = 0,
  width,
  height,
  mainAxisAlignment = 'start',
  crossAxisAlignment = 'center',
  gap = 0,
  padding = 0,
  color = 'transparent',
  borderRadius = 0,
  children,
  ...rest
}: RowProps) {
  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      color={color}
      borderRadius={borderRadius}
      flexDirection="row"
      justifyContent={mainAxisAlignment}
      alignItems={crossAxisAlignment}
      gap={gap}
      padding={padding}
      {...rest}
    >
      {children}
    </Box>
  );
});
