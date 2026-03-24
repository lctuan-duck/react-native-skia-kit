import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';
import type {
  LayoutStyle,
  SpacingStyle,
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
  FlexContainerStyle,
} from '../core/style.types';

// === Row Style ===

export type FlexContainerComponentStyle = LayoutStyle &
  SpacingStyle &
  ColorStyle &
  BorderStyle &
  FlexChildStyle &
  Pick<FlexContainerStyle, 'gap' | 'rowGap'>;

export interface RowProps extends WidgetProps {
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
 * Row — arranges children horizontally.
 * Thin wrapper over Box with flexDirection="row".
 * Children do NOT need x/y — Yoga injects them automatically.
 */
export const Row = React.memo(function Row({
  x = 0,
  y = 0,
  style,
  mainAxisAlignment = 'start',
  crossAxisAlignment = 'center',
  children,
}: RowProps) {
  return (
    <Box
      x={x}
      y={y}
      style={{
        ...style,
        backgroundColor: style?.backgroundColor ?? 'transparent',
        flexDirection: 'row',
        justifyContent: mainAxisAlignment,
        alignItems: crossAxisAlignment,
      }}
    >
      {children}
    </Box>
  );
});
