import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';

export interface ColumnProps extends WidgetProps {
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
 * Column — arranges children vertically.
 * Thin wrapper over Box with flexDirection="column".
 * Children do NOT need x/y — Yoga injects them automatically.
 */
export const Column = React.memo(function Column({
  x = 0,
  y = 0,
  width,
  height,
  mainAxisAlignment = 'start',
  crossAxisAlignment = 'start',
  gap = 0,
  padding = 0,
  color = 'transparent',
  borderRadius = 0,
  children,
  ...rest
}: ColumnProps) {
  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      color={color}
      borderRadius={borderRadius}
      flexDirection="column"
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
