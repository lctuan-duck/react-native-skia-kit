import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

export interface CardProps extends WidgetProps {
  variant?: CardVariant;
  borderRadius?: number;
  backgroundColor?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * Card — elevated/filled/outlined container.
 * Equivalent to Flutter Card / Card.filled / Card.outlined.
 */
export const Card = React.memo(function Card({
  x = 0,
  y = 0,
  width = 280,
  height = 160,
  variant = 'elevated',
  borderRadius = 12,
  backgroundColor,
  children,
  onPress,
  onLongPress,
}: CardProps) {
  const theme = useTheme();
  const styles = resolveCardStyles(variant, backgroundColor, theme);

  useWidget({ type: 'Card', layout: { x, y, width, height } });

  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      borderRadius={borderRadius}
      color={styles.background}
      elevation={styles.elevation}
      borderWidth={styles.borderWidth}
      borderColor={styles.borderColor}
      hitTestBehavior="deferToChild"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {children}
    </Box>
  );
});

function resolveCardStyles(
  variant: CardVariant,
  customBg: string | undefined,
  theme: ReturnType<typeof useTheme>
) {
  const c = theme.colors;
  switch (variant) {
    case 'elevated':
      return {
        background: customBg ?? c.surface,
        elevation: 4,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'filled':
      return {
        background: customBg ?? c.surfaceVariant,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'outlined':
      return {
        background: customBg ?? c.surface,
        elevation: 0,
        borderWidth: 1,
        borderColor: c.border,
      };
    default:
      return {
        background: customBg ?? c.surface,
        elevation: 4,
        borderWidth: 0,
        borderColor: 'transparent',
      };
  }
}
