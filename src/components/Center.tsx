import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';

export type AlignmentValue =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'centerLeft'
  | 'center'
  | 'centerRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight';

export interface CenterProps extends WidgetProps {
  children: React.ReactNode;
}

export interface AlignProps extends CenterProps {
  alignment?: AlignmentValue;
}

const ALIGN_MAP: Record<
  AlignmentValue,
  {
    justifyContent: 'start' | 'center' | 'end';
    alignItems: 'start' | 'center' | 'end';
  }
> = {
  topLeft: { justifyContent: 'start', alignItems: 'start' },
  topCenter: { justifyContent: 'start', alignItems: 'center' },
  topRight: { justifyContent: 'start', alignItems: 'end' },
  centerLeft: { justifyContent: 'center', alignItems: 'start' },
  center: { justifyContent: 'center', alignItems: 'center' },
  centerRight: { justifyContent: 'center', alignItems: 'end' },
  bottomLeft: { justifyContent: 'end', alignItems: 'start' },
  bottomCenter: { justifyContent: 'end', alignItems: 'center' },
  bottomRight: { justifyContent: 'end', alignItems: 'end' },
};

/**
 * Center — centers child both horizontally and vertically.
 * Tương đương Flutter Center.
 */
export const Center = React.memo(function Center({
  x = 0,
  y = 0,
  width,
  height,
  children,
}: CenterProps) {
  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {children}
    </Box>
  );
});

/**
 * Align — positions child within container using named alignment.
 * Tương đương Flutter Align.
 */
export const Align = React.memo(function Align({
  x = 0,
  y = 0,
  width,
  height,
  alignment = 'center',
  children,
}: AlignProps) {
  const { justifyContent, alignItems } = ALIGN_MAP[alignment];
  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      flexDirection="column"
      justifyContent={justifyContent}
      alignItems={alignItems}
    >
      {children}
    </Box>
  );
});
