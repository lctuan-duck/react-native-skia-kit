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
import { resolveSemanticColor, resolveOnColor } from '../core/colorUtils';

// === Badge Types ===

export type BadgeVariant = 'standard' | 'dot';

export type BadgeStyle = ColorStyle &
  BorderStyle &
  FlexChildStyle & {
    textColor?: string;
    width?: number;
    height?: number;
  };

export interface BadgeProps extends WidgetProps {
  /** Variant */
  variant?: BadgeVariant;
  /** Count value (standard variant) */
  value?: number;
  /** Size override */
  size?: number;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: BadgeStyle;
  /** Press callback */
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
  color = 'primary',
  style,
  onPress,
}: BadgeProps) {
  const theme = useTheme();
  const resolvedColor = resolveSemanticColor(color, theme.colors);
  const resolvedOnColor = resolveOnColor(color, theme.colors);

  const bgColor = style?.backgroundColor ?? resolvedColor;
  const fgColor = style?.textColor ?? resolvedOnColor;
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
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: bgColor,
          borderWidth: style?.borderWidth ?? 2,
          borderColor: style?.borderColor ?? theme.colors.surface,
        }}
      />
    );
  }

  // Standard variant — use flex centering
  const label = String(value > 99 ? '99+' : value);

  return (
    <Box
      x={x}
      y={y}
      style={{
        width: badgeSize,
        height: badgeSize,
        borderRadius: badgeSize / 2,
        backgroundColor: bgColor,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      hitTestBehavior={onPress ? 'opaque' : 'deferToChild'}
      onPress={onPress}
    >
      <Text
        text={label}
        style={{
          fontSize: badgeSize * 0.55,
          color: fgColor,
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      />
    </Box>
  );
});
