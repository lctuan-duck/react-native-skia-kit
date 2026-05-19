import * as React from 'react';
import { Box } from './Box';
import { Image } from './Image';

import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import { resolveSemanticColor } from '../core/colorUtils';

// === Avatar Types ===

export type AvatarVariant = 'circle' | 'rounded' | 'square';

export type AvatarStyle = ColorStyle & BorderStyle & FlexChildStyle;

export interface AvatarProps extends WidgetProps {
  /** Size of avatar (width = height) */
  size?: number;
  /** Shape variant */
  variant?: AvatarVariant;
  /** Image source URL or local path */
  src?: string;
  /** Placeholder background color */
  color?: SemanticColor;
  /** Status indicator */
  status?: 'online' | 'offline';
  /** Style override */
  style?: AvatarStyle;
  /** Interactive effect (Default: opacity if pressable) */
  interactive?: 'ripple' | 'bounce' | 'opacity' | 'none';
  /** Press callback */
  onPress?: (localX?: number, localY?: number) => void;
}

/**
 * Avatar — circular/rounded/square profile image.
 * Equivalent to Flutter CircleAvatar.
 */
export const Avatar = React.memo(function Avatar({
  x: _x = 0,
  y: _y = 0,
  size = 48,
  variant = 'circle',
  src,
  color = 'neutral',
  status,
  style,
  interactive,
  onPress,
}: AvatarProps) {
  const theme = useTheme();
  const bgColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
  const borderRadius =
    style?.borderRadius ??
    (variant === 'circle' ? size / 2 : variant === 'rounded' ? size / 4 : 0);

  const dotSize = size * 0.28;

  return (
    <Box
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: bgColor,
        ...style,
      }}
      hitTestBehavior={onPress ? 'opaque' : 'deferToChild'}
      interactive={interactive ?? (onPress ? 'opacity' : 'none')}
      onPress={onPress}
    >
      {src && (
        <Image
          style={{
            position: 'absolute',
            left: 2,
            top: 2,
            width: size - 4,
            height: size - 4,
            borderRadius,
          }}
          src={src}
          fit="cover"
        />
      )}

      {status === 'online' && (
        <Box
          style={{
            position: 'absolute',
            left: size - dotSize,
            top: size - dotSize,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: theme.colors.success,
            borderWidth: 2,
            borderColor: theme.colors.surface,
          }}
        />
      )}
      {status === 'offline' && (
        <Box
          style={{
            position: 'absolute',
            left: size - dotSize,
            top: size - dotSize,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: theme.colors.textDisabled,
            borderWidth: 2,
            borderColor: theme.colors.surface,
          }}
        />
      )}
    </Box>
  );
});

(Avatar as any).skiaWidgetType = 'Avatar';
