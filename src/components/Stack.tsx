import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';
import type { FlexChildStyle } from '../core/style.types';

// === Stack Style ===

export type StackStyle = FlexChildStyle & {
  width?: number;
  height?: number;
};

export interface StackProps extends WidgetProps {
  /** Consolidated style prop */
  style?: StackStyle;
  /** Clip children to stack bounds */
  clipToBounds?: boolean;
  /** Children — use <Positioned> for absolute positioning */
  children?: React.ReactNode;
}

/**
 * PositionedProps — inherits position, top, left, right, bottom via style.
 */
export interface PositionedProps extends WidgetProps {
  /** Consolidated style prop */
  style?: FlexChildStyle & { width?: number; height?: number };
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
  style,
  clipToBounds: _clipToBounds = true,
  children,
}: StackProps) {
  return (
    <Box x={x} y={y} style={style}>
      {children}
    </Box>
  );
});

/**
 * Positioned — absolute positioning within a Stack.
 * Uses Box with position="absolute" + top/left/right/bottom from style.
 *
 * Tương đương Flutter Positioned.
 */
export const Positioned = React.memo(function Positioned({
  style,
  children,
}: PositionedProps) {
  return (
    <Box
      style={{
        ...style,
        position: 'absolute',
      }}
    >
      {children}
    </Box>
  );
});
