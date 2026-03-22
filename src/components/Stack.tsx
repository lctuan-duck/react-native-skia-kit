import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';

export interface StackProps extends WidgetProps {
  /** Width — REQUIRED */
  width: number;
  /** Height — REQUIRED */
  height: number;
  /** Clip children to stack bounds */
  clipToBounds?: boolean;
  /** Children — use <Positioned> for absolute positioning */
  children?: React.ReactNode;
}

/**
 * PositionedProps extends WidgetProps — inherits position, top, left, right, bottom, width, height.
 * No duplicate declarations needed.
 */
export interface PositionedProps extends WidgetProps {
  children: React.ReactNode;
}

/**
 * Stack — overlays children on top of each other (z-axis layering).
 * Child đầu tiên ở dưới cùng, child cuối ở trên cùng.
 * Dùng kèm <Positioned> để đặt vị trí tuyệt đối.
 *
 * Tương đương Flutter Stack + Positioned.
 */
export const Stack = React.memo(function Stack({
  x = 0,
  y = 0,
  width,
  height,
  clipToBounds: _clipToBounds = true,
  children,
}: StackProps) {
  return (
    <Box x={x} y={y} width={width} height={height}>
      {children}
    </Box>
  );
});

/**
 * Positioned — absolute positioning within a Stack.
 * Uses Box with position="absolute" + top/left/right/bottom.
 * All positioning props inherited from WidgetProps.
 *
 * Tương đương Flutter Positioned.
 */
export const Positioned = React.memo(function Positioned({
  top,
  bottom,
  left,
  right,
  width,
  height,
  children,
}: PositionedProps) {
  return (
    <Box
      position="absolute"
      top={top}
      bottom={bottom}
      left={left}
      right={right}
      width={width}
      height={height}
    >
      {children}
    </Box>
  );
});
