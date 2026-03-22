import * as React from 'react';
import { Group, Path } from '@shopify/react-native-skia';
import { Box } from './Box';
import { Text } from './Text';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../core/types';

export interface TooltipProps extends WidgetProps {
  /** Tooltip text content — REQUIRED */
  content: string;
  /** Visible state */
  visible?: boolean;
  /** Arrow direction (where the arrow points relative to tooltip) */
  arrowDirection?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Tooltip — shows supplementary info on hover/tap.
 * Composition: Box (popup) + Text (content) + Path (arrow).
 *
 * Tương đương Flutter Tooltip.
 */
export const Tooltip = React.memo(function Tooltip({
  x = 0,
  y = 0,
  width = 120,
  height = 40,
  content,
  visible = false,
  arrowDirection = 'top',
}: TooltipProps) {
  if (!visible) return null;

  const theme = useTheme();

  useWidget({ type: 'Tooltip', layout: { x, y, width, height } });

  const tooltipBg = theme.colors.inverseSurface;
  const textColor = theme.colors.textInverse;

  const arrowPath =
    arrowDirection === 'top'
      ? `M${x + width / 2 - 6} ${y + height} L${x + width / 2} ${
          y + height + 8
        } L${x + width / 2 + 6} ${y + height}`
      : arrowDirection === 'bottom'
      ? `M${x + width / 2 - 6} ${y} L${x + width / 2} ${y - 8} L${
          x + width / 2 + 6
        } ${y}`
      : arrowDirection === 'left'
      ? `M${x + width} ${y + height / 2 - 6} L${x + width + 8} ${
          y + height / 2
        } L${x + width} ${y + height / 2 + 6}`
      : `M${x} ${y + height / 2 - 6} L${x - 8} ${y + height / 2} L${x} ${
          y + height / 2 + 6
        }`;

  return (
    <Group>
      <Box
        x={x}
        y={y}
        width={width}
        height={height}
        borderRadius={6}
        color={tooltipBg}
      >
        <Text
          x={x + 8}
          y={y + height / 2 - 6.5}
          width={width - 16}
          text={content}
          fontSize={13}
          color={textColor}
          textAlign="center"
        />
      </Box>
      <Path path={arrowPath} color={tooltipBg} />
    </Group>
  );
});
