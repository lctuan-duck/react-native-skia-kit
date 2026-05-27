import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { useTheme } from '../hooks/useTheme';
import { useWidgetId } from '../hooks/useWidgetId';
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
  /** @todo arrowDirection render is not yet implemented */
  arrowDirection?: 'top' | 'bottom' | 'left' | 'right';
  /** Style override */
  style?: TooltipStyle;
}

export const Tooltip = React.memo(function Tooltip({
  content,
  visible = false,
  style,
}: TooltipProps) {
  // ⚠️ All hooks MUST be called before any conditional return (Rules of Hooks)
  const widgetId = useWidgetId('Tooltip');
  const theme = useTheme();

  const width = style?.width ?? 120;
  const height = style?.height ?? 40;
  const tooltipBg = style?.backgroundColor ?? theme.colors.inverseSurface;
  const textColor = style?.textColor ?? theme.colors.textInverse;

  if (!visible) return null;

  return (
    <Box
      id={widgetId}
      style={{
        width,
        height,
        borderRadius: 6,
        backgroundColor: tooltipBg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
      }}
    >
      <Text
        text={content}
        style={{
          fontSize: 13,
          color: textColor,
          textAlign: 'center',
        }}
      />
    </Box>
  );
});

(Tooltip as any).skiaWidgetType = 'Tooltip';
