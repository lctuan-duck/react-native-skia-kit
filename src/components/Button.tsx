import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  LayoutStyle,
  ColorStyle,
  BorderStyle,
  ShadowStyle,
  SpacingStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import {
  resolveSemanticColor,
  resolveOnColor,
  withOpacity,
} from '../core/colorUtils';

// === Button Types ===

export type ButtonVariant =
  | 'solid'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'icon'
  | 'fab';

export type ButtonStyle = LayoutStyle &
  ColorStyle &
  BorderStyle &
  ShadowStyle &
  SpacingStyle &
  FlexChildStyle & {
    textColor?: string;
    iconSize?: number;
    tapSize?: number;
  };

export interface ButtonProps extends WidgetProps {
  /** Label text */
  text?: string;
  /** Icon name */
  icon?: string;
  /** Variant = SHAPE */
  variant?: ButtonVariant;
  /** Semantic color (resolves via theme) */
  color?: SemanticColor;
  /** Disabled state */
  disabled?: boolean;
  /** FAB extended mode (icon + label) */
  extended?: boolean;
  /** Interactive effect (Default: ripple) */
  interactive?: 'ripple' | 'bounce' | 'opacity' | 'none';
  /** Manual ripple color override */
  rippleColor?: string;
  /** Press callback */
  onPress?: (localX?: number, localY?: number) => void;
  /** Long press callback */
  onLongPress?: () => void;
  /** Style override (highest priority) */
  style?: ButtonStyle;
}

/**
 * Button — multi-variant button.
 * Tương đương Flutter ElevatedButton / FilledButton / TextButton / IconButton / FAB.
 *
 * Variant = SHAPE (solid/outline/ghost/link/icon/fab)
 * Color = SEMANTIC (primary/secondary/success/info/warning/error/neutral)
 * → 2 trục độc lập, kết hợp tự do.
 */
export const Button = React.memo(function Button({
  x = 0,
  y = 0,
  text,
  icon,
  variant = 'solid',
  color = 'primary',
  disabled = false,
  extended = false,
  interactive = 'ripple',
  rippleColor,
  onPress,
  onLongPress,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const resolvedColor = resolveSemanticColor(color, theme.colors);
  const resolvedOnColor = resolveOnColor(color, theme.colors);
  const variantStyles = resolveVariantStyles(
    variant,
    resolvedColor,
    resolvedOnColor,
    theme
  );

  // Style overrides take highest priority
  const bgColor = style?.backgroundColor ?? variantStyles.background;
  const fgColor = style?.textColor ?? variantStyles.foreground;
  const borderW = style?.borderWidth ?? variantStyles.borderWidth;
  const borderC = style?.borderColor ?? variantStyles.borderColor;
  const elev = style?.elevation ?? variantStyles.elevation;
  const borderR = style?.borderRadius ?? 8;
  const iconSz = style?.iconSize ?? 20;
  const tapSz = style?.tapSize ?? 48;

  const w = style?.width;
  const h = style?.height ?? 48;

  useWidget<{ variant: string }>({
    type: 'Button',
    layout: { x, y, width: w ?? 100, height: h },
    props: { variant },
  });

  // ===== Icon-only variant =====
  if (variant === 'icon') {
    return (
      <Box
        x={x}
        y={y}
        style={{
          width: tapSz,
          height: tapSz,
          borderRadius: tapSz / 2,
          backgroundColor: style?.backgroundColor ?? 'transparent',
          opacity: disabled ? 0.4 : 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        hitTestBehavior="opaque"
        interactive={disabled ? 'none' : interactive}
        onPress={(x, y) => !disabled && onPress?.(x, y)}
        onLongPress={onLongPress}
      >
        <Icon name={icon!} size={iconSz} color={fgColor} />
      </Box>
    );
  }

  // ===== FAB variant =====
  if (variant === 'fab') {
    const fabWidth = extended ? w ?? 140 : 56;
    return (
      <Box
        x={x}
        y={y}
        style={{
          width: fabWidth,
          height: 56,
          borderRadius: 28,
          backgroundColor: bgColor,
          elevation: elev,
          opacity: disabled ? 0.4 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: extended ? [0, 20, 0, 16] : 0,
          gap: extended ? 8 : 0,
        }}
        hitTestBehavior="opaque"
        interactive={disabled ? 'none' : interactive}
        onPress={(x, y) => !disabled && onPress?.(x, y)}
        onLongPress={onLongPress}
      >
        <Icon name={icon!} size={24} color={fgColor} />
        {extended && text && (
          <Text
            text={text}
            style={{ fontSize: 14, fontWeight: 'bold', color: fgColor }}
          />
        )}
      </Box>
    );
  }

  // ===== Standard variants: solid / outline / ghost / link =====
  const btnWidth = w ?? Math.max(80, (text?.length ?? 0) * 9 + 32);
  return (
    <Box
      x={x}
      y={y}
      style={{
        width: btnWidth,
        height: h,
        borderRadius: borderR,
        backgroundColor: bgColor,
        borderWidth: borderW,
        borderColor: borderC,
        elevation: elev,
        opacity: disabled ? 0.4 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: style?.padding ?? [0, 16, 0, 16],
        gap: icon && text ? 8 : 0,
      }}
      hitTestBehavior="opaque"
      interactive={disabled ? 'none' : interactive}
      rippleColor={rippleColor}
      onPress={(x, y) => !disabled && onPress?.(x, y)}
      onLongPress={onLongPress}
    >
      {icon && <Icon name={icon} size={iconSz} color={fgColor} />}
      {text && (
        <Text
          text={text}
          style={{ fontSize: 14, fontWeight: 'bold', color: fgColor, textAlign: 'center' }}
        />
      )}
    </Box>
  );
});

// Variant → style resolution
function resolveVariantStyles(
  variant: ButtonVariant,
  color: string,
  onColor: string,
  _theme: ReturnType<typeof useTheme>
) {
  switch (variant) {
    case 'solid':
      return {
        background: color,
        foreground: onColor,
        elevation: 2,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'ghost':
      return {
        background: withOpacity(color, 0.15),
        foreground: color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'outline':
      return {
        background: 'transparent',
        foreground: color,
        elevation: 0,
        borderWidth: 1,
        borderColor: color,
      };
    case 'link':
      return {
        background: 'transparent',
        foreground: color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'icon':
      return {
        background: 'transparent',
        foreground: color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'fab':
      return {
        background: color,
        foreground: onColor,
        elevation: 6,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    default:
      return {
        background: color,
        foreground: onColor,
        elevation: 2,
        borderWidth: 0,
        borderColor: 'transparent',
      };
  }
}
