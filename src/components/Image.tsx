import * as React from 'react';
import type { WidgetProps } from '../types/widget.types';
import type { ColorStyle, BorderStyle, FlexChildStyle } from '../types/style.types';

export type ImageStyle = ColorStyle &
  BorderStyle &
  FlexChildStyle & {
    width?: number;
    height?: number;
  };

export interface ImageProps extends WidgetProps {
  /** Image source URL or local path — REQUIRED */
  src?: string;
  source?: { uri: string };
  uri?: string;
  /** Resize mode */
  fit?: 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight';
  /** Placeholder component when loading */
  placeholder?: React.ReactNode;
  /** Style override (width, height, borderRadius, opacity) */
  style?: ImageStyle;
  /** Press callback */
  onPress?: () => void;
  /** Error callback */
  onError?: (error: string) => void;
  /** Load complete callback */
  onLoad?: () => void;
  children?: any;
}

export const Image = React.forwardRef<any, ImageProps>((props, ref) => {
  return React.createElement('Image', { ...props, ref }, props.children);
});

(Image as any).skiaWidgetType = 'Image';
