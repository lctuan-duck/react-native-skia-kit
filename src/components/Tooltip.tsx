import * as React from 'react';
import { Group, Path } from '@shopify/react-native-skia';
import { Box } from './Box';
import { Text } from './Text';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types/widget.types';
import type { ColorStyle, FlexChildStyle } from '../types/style.types';

// === Tooltip Types ===

export type TooltipStyle = ColorStyle &
  FlexChildStyle & {
    textColor?: string;
    width?: number;
    height?: number;
  };

export interface TooltipProps extends WidgetProps {
  content: string;
  visible?: boolean;
  arrowDirection?: 'top' | 'bottom' | 'left' | 'right';
  /** Style override */
  style?: TooltipStyle;
}

export const Tooltip = React.memo(function Tooltip({
  x = 0,
  y = 0,
  content,
  visible = false,
  arrowDirection = 'top',
  style,
}: TooltipProps) {
  if (!visible) return null;

  const theme = useTheme();
  const width = style?.width ?? 120;
  const height = style?.height ?? 40;
  const tooltipBg = style?.backgroundColor ?? theme.colors.inverseSurface;
  const textColor = style?.textColor ?? theme.colors.textInverse;

  useWidget({ type: 'Tooltip', layout: { x, y, width, height } });

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
        style={{
          width,
          height,
          borderRadius: 6,
          backgroundColor: tooltipBg,
        }}
      >
        <Text
          x={x + 8}
          y={y + height / 2 - 6.5}
          text={content}
          style={{
            width: width - 16,
            fontSize: 13,
            color: textColor,
            textAlign: 'center',
          }}
        />
      </Box>
      <Path path={arrowPath} color={tooltipBg} />
    </Group>
  );
});
