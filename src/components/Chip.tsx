import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export type ChipVariant = 'filled' | 'outlined';

export interface ChipProps extends WidgetProps {
  /** Label text — REQUIRED */
  label: string;
  /** Selected state */
  selected?: boolean;
  /** Variant: filled (solid bg) or outlined (border only) */
  variant?: ChipVariant;
  /** Primary color for the chip */
  color?: string;
  /** Border radius */
  borderRadius?: number;
  /** Press callback */
  onPress?: () => void;
}

/**
 * Chip — tag/filter element with filled and outlined variants.
 * Tương đương Flutter Chip / FilterChip / ChoiceChip.
 *
 * Composition: Box (background/border) + Text (label).
 */
export const Chip = React.memo(function Chip({
  x = 0,
  y = 0,
  width = 80,
  height = 32,
  label,
  selected = false,
  variant = 'filled',
  color,
  borderRadius = 16,
  onPress,
}: ChipProps) {
  const theme = useTheme();
  const chipColor = color ?? theme.colors.primary;
  const styles = resolveChipStyles(variant, chipColor, selected, theme);

  useWidget({
    type: 'Chip',
    layout: { x, y, width, height },
  });

  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      borderRadius={borderRadius}
      color={styles.background}
      borderWidth={styles.borderWidth}
      borderColor={styles.borderColor}
      hitTestBehavior="opaque"
      onPress={onPress}
    >
      <Text
        x={x + 8}
        y={y + height / 2 - 6.5}
        width={width - 16}
        text={label}
        fontSize={13}
        color={styles.textColor}
        textAlign="center"
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

  if (variant === 'outlined') {
    return {
      background: 'transparent',
      borderWidth: 1,
      borderColor: selected ? chipColor : c.border,
      textColor: selected ? chipColor : c.textSecondary,
    };
  }

  // filled variant
  return {
    background: selected ? chipColor : c.surfaceVariant,
    borderWidth: 0,
    borderColor: 'transparent',
    textColor: selected ? contrastColor(chipColor) : c.textBody,
  };
}

function contrastColor(hex: string): string {
  if (!hex || hex.length < 7) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
