import * as React from 'react';
import type { BoxProps } from '../types/widget.types';

/**
 * Box component - Primitive container for SkiaKit.
 * Layout and drawing are completely offloaded to C++ (BoxNode).
 */
export const Box = React.forwardRef<any, BoxProps>((props, ref) => {
  // @ts-ignore - 'Box' is treated as a host component string by SkiaKitReconciler
  return React.createElement('Box', { ...props, ref }, props.children);
});

(Box as any).skiaWidgetType = 'Box';
