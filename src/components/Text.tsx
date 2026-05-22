import * as React from 'react';
import type { HitTestBehavior, WidgetProps } from '../types/widget.types';
import type { SkiaTextStyle, FlexChildStyle } from '../types/style.types';

export type EllipsisMode = 'none' | 'tail' | 'head' | 'middle' | 'clip';

export type TextComponentStyle = SkiaTextStyle &
  FlexChildStyle & {
    opacity?: number;
    numberOfLines?: number;
    ellipsis?: EllipsisMode;
    width?: number;
    height?: number;
  };

export interface TextProps extends WidgetProps {
  /** Text content */
  text?: string;
  /** Consolidated style prop */
  style?: TextComponentStyle;
  /** Hit test behavior */
  hitTestBehavior?: HitTestBehavior;
  /** Press callback */
  onPress?: () => void;
  /** Long press callback */
  onLongPress?: () => void;
  /** Children (string content) */
  children?: string;
}

export const Text = React.forwardRef<any, TextProps>((props, ref) => {
  return React.createElement('Text', { ...props, ref }, props.children);
});

(Text as any).skiaWidgetType = 'Text';
