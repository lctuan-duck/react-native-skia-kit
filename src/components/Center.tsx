import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import type { FlexChildStyle } from '../types/style.types';

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

// === Center/Align Style ===

export type CenterStyle = FlexChildStyle & {
  width?: number;
  height?: number;
};

export interface CenterProps extends WidgetProps {
  /** Consolidated style prop */
  style?: CenterStyle;
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
  style,
  children,
}: CenterProps) {
  return (
    <Box
      style={{
        ...style,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
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
  style,
  alignment = 'center',
  children,
}: AlignProps) {
  const { justifyContent, alignItems } = ALIGN_MAP[alignment];
  return (
    <Box
      style={{
        ...style,
        flexDirection: 'column',
        justifyContent,
        alignItems,
      }}
    >
      {children}
    </Box>
  );
});

(Center as any).skiaWidgetType = 'Center';

(Align as any).skiaWidgetType = 'Align';
