import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import {
  resolveSemanticColor,
  withOpacity,
  contrastColor,
} from '../core/colorUtils';

// === Chip Types ===

export type ChipVariant = 'solid' | 'outline' | 'ghost';

export type ChipStyle = ColorStyle &
  BorderStyle &
  FlexChildStyle & {
    textColor?: string;
    width?: number;
    height?: number;
  };

export interface ChipProps extends WidgetProps {
  /** Label text — REQUIRED */
  label: string;
  /** Selected state */
  selected?: boolean;
  /** Variant */
  variant?: ChipVariant;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: ChipStyle;
  /** Press callback */
  onPress?: (localX?: number, localY?: number) => void;
}

/**
 * Chip — tag/filter element with multiple variants.
 * Tương đương Flutter Chip / FilterChip / ChoiceChip.
 */
export const Chip = React.memo(function Chip({
  x = 0,
  y = 0,
  label,
  selected = false,
  variant = 'solid',
  color = 'primary',
  style,
  onPress,
}: ChipProps) {
  const theme = useTheme();
  const chipColor = resolveSemanticColor(color, theme.colors);
  const variantStyles = resolveChipStyles(variant, chipColor, selected, theme);

  const width = style?.width ?? 80;
  const height = style?.height ?? 32;
  const borderR = style?.borderRadius ?? 16;
  const bgColor = style?.backgroundColor ?? variantStyles.background;
  const fgColor = style?.textColor ?? variantStyles.textColor;

  useWidget({
    type: 'Chip',
    layout: { x, y, width, height },
  });

  return (
    <Box
      x={x}
      y={y}
      style={{
        width,
        height,
        borderRadius: borderR,
        backgroundColor: bgColor,
        borderWidth: style?.borderWidth ?? variantStyles.borderWidth,
        borderColor: style?.borderColor ?? variantStyles.borderColor,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      hitTestBehavior="translucent"
      interactive="opacity"
      onPress={onPress}
    >
      <Text
        text={label}
        style={{
          fontSize: 13,
          color: fgColor,
          textAlign: 'center',
        }}
      />
    </Box>
  );
});

function resolveChipStyles(
  variant: ChipVariant,
  chipColor: string,
  selected: boolean,
  theme: ReturnType<typeof useTheme>
) {
  const c = theme.colors;

  switch (variant) {
    case 'outline':
      return {
        background: 'transparent',
        borderWidth: 1,
        borderColor: selected ? chipColor : c.border,
        textColor: selected ? chipColor : c.textSecondary,
      };
    case 'ghost':
      return {
        background: selected
          ? withOpacity(chipColor, 0.15)
          : withOpacity(chipColor, 0.08),
        borderWidth: 0,
        borderColor: 'transparent',
        textColor: selected ? chipColor : c.textSecondary,
      };
    case 'solid':
    default:
      return {
        background: selected ? chipColor : c.surfaceVariant,
        borderWidth: 0,
        borderColor: 'transparent',
        textColor: selected ? contrastColor(chipColor) : c.textBody,
      };
  }
}
