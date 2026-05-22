import * as React from 'react';
import type { WidgetProps } from '../types/widget.types';
import type { FlexChildStyle, SpacingStyle } from '../types/style.types';

export type ScrollViewStyle = FlexChildStyle &
  SpacingStyle & {
    width?: number | string;
    height?: number | string;
  };

export interface ScrollViewProps extends WidgetProps {
  children: React.ReactNode;
  horizontal?: boolean;
  physics?: 'clamped' | 'bouncing';
  contentSize?: number;
  scrollEnabled?: boolean;
  onScroll?: (offset: number) => void;
  /** Style override */
  style?: ScrollViewStyle;
}

export const ScrollView = React.forwardRef<any, ScrollViewProps>((props, ref) => {
  return React.createElement('Scroll', { ...props, ref }, props.children);
});

(ScrollView as any).skiaWidgetType = 'ScrollView';

export interface GridViewProps extends ScrollViewProps {
  crossAxisCount?: number;
  mainAxisSpacing?: number;
  crossAxisSpacing?: number;
  childAspectRatio?: number;
}

export const GridView = React.forwardRef<any, GridViewProps>((props, ref) => {
  return React.createElement('Scroll', { ...props, ref }, props.children);
});

(GridView as any).skiaWidgetType = 'GridView';

export interface PageViewProps extends ScrollViewProps {
  initialPage?: number;
  onPageChanged?: (page: number) => void;
}

export const PageView = React.forwardRef<any, PageViewProps>((props, ref) => {
  return React.createElement('Scroll', { ...props, ref }, props.children);
});

(PageView as any).skiaWidgetType = 'PageView';
