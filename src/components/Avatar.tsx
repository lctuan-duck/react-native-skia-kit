import * as React from 'react';
import { Box } from './Box';
import { Image } from './Image';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export type AvatarVariant = 'circle' | 'rounded' | 'square';

export interface AvatarProps extends WidgetProps {
  size?: number;
  variant?: AvatarVariant;
  /** Image source URL or local path */
  src?: string;
  /** Placeholder background color */
  color?: string;
  /** Status indicator */
  status?: 'online' | 'offline';
  onPress?: () => void;
}

/**
 * Avatar — circular/rounded/square profile image.
 * Composition: Image (with borderRadius) + Box (status dot).
 * Equivalent to Flutter CircleAvatar.
 */
export const Avatar = React.memo(function Avatar({
  x = 0,
  y = 0,
  size = 48,
  variant = 'circle',
  src,
  color,
  status,
  onPress,
}: AvatarProps) {
  const theme = useTheme();
  const bgColor = color ?? theme.colors.surfaceVariant;
  const borderRadius =
    variant === 'circle' ? size / 2 : variant === 'rounded' ? size / 4 : 0;

  const dotSize = size * 0.28;
  const dotX = x + size - dotSize;
  const dotY = y + size - dotSize;

  useWidget({
    type: 'Avatar',
    layout: { x, y, width: size, height: size },
  });

  return (
    <Box
      x={x}
      y={y}
      width={size}
      height={size}
      borderRadius={borderRadius}
      color={bgColor}
      hitTestBehavior={onPress ? 'opaque' : 'deferToChild'}
      onPress={onPress}
    >
      {/* Image — render when src is provided */}
      {src && (
        <Image
          x={x + 2}
          y={y + 2}
          width={size - 4}
          height={size - 4}
          src={src}
          borderRadius={borderRadius}
          fit="cover"
        />
      )}

      {/* Status indicator */}
      {status === 'online' && (
        <Box
          x={dotX}
          y={dotY}
          width={dotSize}
          height={dotSize}
          borderRadius={dotSize / 2}
          color={theme.colors.success}
          borderWidth={2}
          borderColor={theme.colors.surface}
        />
      )}
      {status === 'offline' && (
        <Box
          x={dotX}
          y={dotY}
          width={dotSize}
          height={dotSize}
          borderRadius={dotSize / 2}
          color={theme.colors.textDisabled}
          borderWidth={2}
          borderColor={theme.colors.surface}
        />
      )}
    </Box>
  );
});
