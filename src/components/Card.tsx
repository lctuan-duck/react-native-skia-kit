import * as React from 'react';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  BorderStyle,
  ShadowStyle,
  SpacingStyle,
  FlexChildStyle,
  SemanticColor,
} from '../core/style.types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';

// === Card Types ===

export type CardVariant = 'solid' | 'outline' | 'ghost';

export type CardStyle = ColorStyle &
  BorderStyle &
  ShadowStyle &
  SpacingStyle &
  FlexChildStyle & {
    width?: number;
    height?: number;
  };

export interface CardProps extends WidgetProps {
  /** Variant */
  variant?: CardVariant;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: CardStyle;
  /** Press callback */
  onPress?: () => void;
  /** Long press callback */
  onLongPress?: () => void;
  /** Children */
  children?: React.ReactNode;
}

/**
 * Card — elevated/filled/outlined container.
 * Equivalent to Flutter Card / Card.filled / Card.outlined.
 */
export const Card = React.memo(function Card({
  x = 0,
  y = 0,
  variant = 'solid',
  color: _color = 'primary',
  style,
  children,
  onPress,
  onLongPress,
}: CardProps) {
  const theme = useTheme();
  const variantStyles = resolveCardStyles(variant, theme);

  const bgColor = style?.backgroundColor ?? variantStyles.background;
  const borderR = style?.borderRadius ?? 12;
  const elev = style?.elevation ?? variantStyles.elevation;
  const borderW = style?.borderWidth ?? variantStyles.borderWidth;
  const borderC = style?.borderColor ?? variantStyles.borderColor;

  const w = style?.width;
  const h = style?.height;

  useWidget({
    type: 'Card',
    layout: { x, y, width: w ?? 0, height: h ?? 0 },
  });

  return (
    <Box
      x={x}
      y={y}
      style={{
        ...style,
        width: w,
        height: h,
        borderRadius: borderR,
        backgroundColor: bgColor,
        elevation: elev,
        borderWidth: borderW,
        borderColor: borderC,
      }}
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
  theme: ReturnType<typeof useTheme>
) {
  const c = theme.colors;
  switch (variant) {
    case 'solid':
      return {
        background: c.surface,
        elevation: 4,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'ghost':
      return {
        background: c.surfaceVariant,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'outline':
      return {
        background: c.surface,
        elevation: 0,
        borderWidth: 1,
        borderColor: c.border,
      };
    default:
      return {
        background: c.surface,
        elevation: 4,
        borderWidth: 0,
        borderColor: 'transparent',
      };
  }
}
