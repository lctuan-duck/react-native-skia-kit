import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export type ButtonVariant =
  | 'filled'
  | 'ghost'
  | 'elevated'
  | 'outlined'
  | 'text'
  | 'icon'
  | 'fab';

export interface ButtonProps extends WidgetProps {
  /** Label text */
  text?: string;
  /** Icon name (future: when Icon component is implemented) */
  icon?: string;
  /** Icon size */
  iconSize?: number;
  /** Variant = SHAPE (independent from color) */
  variant?: ButtonVariant;
  /** Color = SEMANTIC (independent from variant) */
  color?: string;
  /** Custom text color (otherwise auto from variant) */
  textColor?: string;
  /** Border radius */
  borderRadius?: number;
  /** Disabled state */
  disabled?: boolean;
  /** FAB extended mode (icon + label) */
  extended?: boolean;
  /** Icon button tap area size */
  tapSize?: number;
  /** Press callback */
  onPress?: () => void;
  /** Long press callback */
  onLongPress?: () => void;
}

/**
 * Button — multi-variant button.
 * Tương đương Flutter ElevatedButton / FilledButton / TextButton / IconButton / FAB.
 *
 * Variant = SHAPE (filled/ghost/elevated/outlined/text/icon/fab)
 * Color = SEMANTIC (primary/error/success — independent of variant)
 * → 2 trục độc lập, kết hợp tự do.
 */
export const Button = React.memo(function Button({
  x = 0,
  y = 0,
  width,
  height = 48,
  text,
  icon,
  iconSize = 20,
  variant = 'filled',
  color,
  textColor,
  borderRadius = 8,
  disabled = false,
  extended = false,
  tapSize = 48,
  onPress,
  onLongPress,
}: ButtonProps) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.colors.primary;
  const styles = resolveStyles(variant, resolvedColor, textColor, theme);

  useWidget<{ variant: string }>({
    type: 'Button',
    layout: { x, y, width: width ?? 100, height },
    props: { variant },
  });

  // ===== Icon-only variant =====
  if (variant === 'icon') {
    return (
      <Box
        x={x}
        y={y}
        width={tapSize}
        height={tapSize}
        borderRadius={tapSize / 2}
        color="transparent"
        hitTestBehavior="opaque"
        onPress={() => !disabled && onPress?.()}
        opacity={disabled ? 0.4 : 1}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Icon name={icon!} size={iconSize} color={styles.foreground} />
      </Box>
    );
  }

  // ===== FAB variant =====
  if (variant === 'fab') {
    const fabSize = extended ? undefined : 56;
    return (
      <Box
        x={x}
        y={y}
        width={fabSize ?? width ?? 56}
        height={56}
        borderRadius={28}
        color={styles.background}
        elevation={6}
        hitTestBehavior="opaque"
        onPress={() => !disabled && onPress?.()}
        opacity={disabled ? 0.4 : 1}
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        padding={extended ? [0, 20, 0, 16] : 0}
        gap={extended ? 8 : 0}
      >
        <Icon name={icon!} size={24} color={styles.foreground} />
        {extended && text && (
          <Text
            text={text}
            fontSize={14}
            fontWeight="bold"
            color={styles.foreground}
          />
        )}
      </Box>
    );
  }

  // ===== Standard variants: filled / ghost / elevated / outlined / text =====
  const btnWidth = width ?? Math.max(80, (text?.length ?? 0) * 9 + 32);
  return (
    <Box
      x={x}
      y={y}
      width={btnWidth}
      height={height}
      borderRadius={borderRadius}
      color={styles.background}
      borderWidth={styles.borderWidth}
      borderColor={styles.borderColor}
      elevation={styles.elevation}
      hitTestBehavior="opaque"
      onPress={() => !disabled && onPress?.()}
      onLongPress={onLongPress}
      opacity={disabled ? 0.4 : 1}
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      padding={[0, 16, 0, 16]}
      gap={icon && text ? 8 : 0}
    >
      {icon && <Icon name={icon} size={iconSize} color={styles.foreground} />}
      {text && (
        <Text
          text={text}
          fontSize={14}
          fontWeight="bold"
          color={styles.foreground}
        />
      )}
    </Box>
  );
});

// Variant = SHAPE, color = MÀU → 2 trục độc lập
function resolveStyles(
  variant: ButtonVariant,
  color: string,
  customTextColor: string | undefined,
  theme: ReturnType<typeof useTheme>
) {
  const c = theme.colors;

  switch (variant) {
    case 'filled':
      return {
        background: color,
        foreground: customTextColor ?? contrastColor(color),
        elevation: 2,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'ghost':
      return {
        background: withOpacity(color, 0.15),
        foreground: customTextColor ?? color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'elevated':
      return {
        background: c.surface,
        foreground: customTextColor ?? color,
        elevation: 4,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'outlined':
      return {
        background: 'transparent',
        foreground: customTextColor ?? color,
        elevation: 0,
        borderWidth: 1,
        borderColor: color,
      };
    case 'text':
      return {
        background: 'transparent',
        foreground: customTextColor ?? color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'icon':
      return {
        background: 'transparent',
        foreground: customTextColor ?? color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'fab':
      return {
        background: color,
        foreground: customTextColor ?? contrastColor(color),
        elevation: 6,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    default:
      return {
        background: color,
        foreground: customTextColor ?? contrastColor(color),
        elevation: 2,
        borderWidth: 0,
        borderColor: 'transparent',
      };
  }
}

function contrastColor(hex: string): string {
  if (!hex || hex.length < 7) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function withOpacity(hex: string, opacity: number): string {
  if (!hex || hex.length < 7) return hex;
  return (
    hex +
    Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')
  );
}
