import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export type BadgeVariant = 'standard' | 'dot';

export interface BadgeProps extends WidgetProps {
  variant?: BadgeVariant;
  value?: number;
  size?: number;
  color?: string;
  textColor?: string;
  onPress?: () => void;
}

/**
 * Badge — notification count or indicator dot.
 * Equivalent to Flutter Badge / Badge.count.
 */
export const Badge = React.memo(function Badge({
  x = 0,
  y = 0,
  variant = 'standard',
  value = 1,
  size,
  color,
  textColor,
  onPress,
}: BadgeProps) {
  const theme = useTheme();
  const bgColor = color ?? theme.colors.error;
  const fgColor = textColor ?? theme.colors.onError;
  const badgeSize = variant === 'dot' ? size ?? 10 : size ?? 20;

  useWidget({
    type: 'Badge',
    layout: { x, y, width: badgeSize, height: badgeSize },
  });

  // Dot variant
  if (variant === 'dot') {
    const dotSize = size ?? 10;
    return (
      <Box
        x={x}
        y={y}
        width={dotSize}
        height={dotSize}
        borderRadius={dotSize / 2}
        color={bgColor}
        borderWidth={2}
        borderColor={theme.colors.surface}
      />
    );
  }

  // Standard variant
  const label = String(value > 99 ? '99+' : value);

  return (
    <Box
      x={x}
      y={y}
      width={badgeSize}
      height={badgeSize}
      borderRadius={badgeSize / 2}
      color={bgColor}
      hitTestBehavior={onPress ? 'opaque' : 'deferToChild'}
      onPress={onPress}
    >
      <Text
        x={x}
        y={y + badgeSize / 2 - (badgeSize * 0.55) / 2}
        width={badgeSize}
        text={label}
        fontSize={badgeSize * 0.55}
        color={fgColor}
        textAlign="center"
        fontWeight="bold"
      />
    </Box>
  );
});
