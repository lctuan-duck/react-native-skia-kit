import * as React from 'react';
import {
  Group,
  Image as SkiaImage,
  RoundedRect,
  useImage,
} from '@shopify/react-native-skia';
import type { WidgetProps } from '../core/types';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';

export interface ImageProps extends WidgetProps {
  /** Image source URL or local path — REQUIRED */
  src: string;
  /** Border radius */
  borderRadius?: number;
  /** Opacity 0-1 */
  opacity?: number;
  /** Resize mode */
  fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight';
  /** Placeholder component when loading */
  placeholder?: React.ReactNode;
  /** Press callback */
  onPress?: () => void;
  /** Error callback */
  onError?: (e: Error) => void;
  /** Load complete callback */
  onLoad?: () => void;
}

/**
 * Image — displays an image from URL or local path.
 * Uses Skia's useImage hook for lazy loading.
 *
 * Tương đương Flutter Image / Image.network / CachedNetworkImage.
 */
export const SkiaKitImage = React.memo(function SkiaKitImage({
  x = 0,
  y = 0,
  width = 120,
  height = 80,
  src,
  borderRadius = 0,
  opacity = 1,
  fit = 'cover',
  placeholder,
  onPress,
  onLoad,
}: ImageProps) {
  const image = useImage(src);

  const widgetId = useWidget({
    type: 'Image',
    layout: { x, y, width, height },
  });

  // Register hit test for onPress — using widgetId from useWidget
  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: { onPress },
    behavior: onPress ? 'opaque' : 'deferToChild',
  });

  // Call onLoad when image finishes loading
  React.useEffect(() => {
    if (image) {
      onLoad?.();
    }
  }, [image, onLoad]);

  if (!image) {
    // Placeholder: gray rect while loading
    return (
      (placeholder as React.ReactElement) ?? (
        <RoundedRect
          x={x}
          y={y}
          width={width}
          height={height}
          r={borderRadius}
          color="rgba(200,200,200,0.5)"
        />
      )
    );
  }

  if (borderRadius > 0) {
    return (
      <Group
        opacity={opacity}
        clip={{ x, y, width, height, rx: borderRadius, ry: borderRadius }}
      >
        <SkiaImage
          image={image}
          x={x}
          y={y}
          width={width}
          height={height}
          fit={fit}
        />
      </Group>
    );
  }

  return (
    <SkiaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      fit={fit}
      opacity={opacity}
    />
  );
});

// Export as "Image" for cleaner imports
export { SkiaKitImage as Image };
