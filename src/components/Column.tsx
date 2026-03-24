import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import type {
  LayoutStyle,
  SpacingStyle,
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
  FlexContainerStyle,
} from '../types/style.types';

// === Column Style (same as Row) ===

export type FlexContainerComponentStyle = LayoutStyle &
  SpacingStyle &
  ColorStyle &
  BorderStyle &
  FlexChildStyle &
  Pick<FlexContainerStyle, 'gap' | 'rowGap'>;

export interface ColumnProps extends WidgetProps {
  /** Consolidated style prop */
  style?: FlexContainerComponentStyle;
  /** Convenience: main axis alignment (maps to justifyContent) */
  mainAxisAlignment?:
    | 'start'
    | 'center'
    | 'end'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly';
  /** Convenience: cross axis alignment (maps to alignItems) */
  crossAxisAlignment?: 'start' | 'center' | 'end' | 'stretch';
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
  style,
  mainAxisAlignment = 'start',
  crossAxisAlignment = 'start',
  children,
}: ColumnProps) {
  return (
    <Box
      x={x}
      y={y}
      style={{
        ...style,
        backgroundColor: style?.backgroundColor ?? 'transparent',
        borderRadius: style?.borderRadius ?? 0,
        flexDirection: 'column',
        justifyContent: mainAxisAlignment,
        alignItems: crossAxisAlignment,
      }}
    >
      {children}
    </Box>
  );
});
