import * as React from 'react';
import {
  Group,
  Image as SkiaImage,
  RoundedRect,
  useImage,
} from '@shopify/react-native-skia';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
} from '../types/style.types';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';

// === Image Types ===

export type ImageStyle = ColorStyle &
  BorderStyle &
  FlexChildStyle & {
    width?: number;
    height?: number;
  };

export interface ImageProps extends WidgetProps {
  /** Image source URL or local path — REQUIRED */
  src: string;
  /** Resize mode */
  fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight';
  /** Placeholder component when loading */
  placeholder?: React.ReactNode;
  /** Style override (width, height, borderRadius, opacity) */
  style?: ImageStyle;
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
 */
export const SkiaKitImage = React.memo(function SkiaKitImage({
  x = 0,
  y = 0,
  src,
  fit = 'cover',
  placeholder,
  style,
  onPress,
  onLoad,
}: ImageProps) {
  const image = useImage(src);

  const width = style?.width ?? 120;
  const height = style?.height ?? 80;
  const borderRadius = style?.borderRadius ?? 0;
  const opacity = style?.opacity ?? 1;

  const widgetId = useWidget({
    type: 'Image',
    layout: { x, y, width, height },
  });

  const layoutResult = useNativeYogaLayout(
    widgetId,
    {
      ...style,
      width,
      height,
    }
  );

  const finalX = layoutResult?.x ?? x;
  const finalY = layoutResult?.y ?? y;
  const finalWidth = layoutResult?.width ?? width;
  const finalHeight = layoutResult?.height ?? height;

  useHitTest(widgetId, {
    rect: { left: finalX, top: finalY, width: finalWidth, height: finalHeight },
    callbacks: { onPress },
    behavior: onPress ? 'opaque' : 'deferToChild',
  });

  React.useEffect(() => {
    if (image) {
      onLoad?.();
    }
  }, [image, onLoad]);

  if (!image) {
    return (
      (placeholder as React.ReactElement) ?? (
        <RoundedRect
          x={finalX}
          y={finalY}
          width={finalWidth}
          height={finalHeight}
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
        clip={{ x: finalX, y: finalY, width: finalWidth, height: finalHeight, rx: borderRadius, ry: borderRadius }}
      >
        <SkiaImage
          image={image}
          x={finalX}
          y={finalY}
          width={finalWidth}
          height={finalHeight}
          fit={fit}
        />
      </Group>
    );
  }

  return (
    <SkiaImage
      image={image}
      x={finalX}
      y={finalY}
      width={finalWidth}
      height={finalHeight}
      fit={fit}
      opacity={opacity}
    />
  );
});

export { SkiaKitImage as Image };

(SkiaKitImage as any).skiaWidgetType = 'SkiaKitImage';
