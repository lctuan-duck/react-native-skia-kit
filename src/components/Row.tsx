import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import type {
  LayoutStyle,
  SpacingStyle,
  ColorStyle,
  BorderStyle,
  FlexContainerStyle,
} from '../types/style.types';

// === Row Style ===

export type FlexContainerComponentStyle = LayoutStyle &
  SpacingStyle &
  ColorStyle &
  BorderStyle &
  FlexContainerStyle;

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
  id,
  style,
  mainAxisAlignment = 'start',
  crossAxisAlignment = 'center',
  children,
}: RowProps) {
  return (
    <Box
      id={id}
      style={{
        ...style,
        backgroundColor: style?.backgroundColor ?? 'transparent',
        flexDirection: 'row',
        justifyContent: style?.justifyContent ?? mainAxisAlignment,
        alignItems: style?.alignItems ?? crossAxisAlignment,
      }}
    >
      {children}
    </Box>
  );
});

(Row as any).skiaWidgetType = 'Row';
