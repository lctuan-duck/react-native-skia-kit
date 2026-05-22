import * as React from 'react';
import type { WidgetProps } from '../types/widget.types'; 

export interface IconProps extends WidgetProps {
  /** Icon name from built-in icon map — REQUIRED */
  name: string;
  /** Size (default: 24) */
  size?: number;
  /** Color (default: theme.colors.textBody) */
  color?: string;
  /** Opacity 0-1 */
  opacity?: number;
  /** Press callback */
  onPress?: () => void;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const Icon = React.forwardRef<any, IconProps>((props, ref) => {
  return React.createElement('Icon', { ...props, ref }, props.children);
});

(Icon as any).skiaWidgetType = 'Icon';

export function getIconNames(): string[] {
  // Hardcode or get from some map
  return ['home', 'settings', 'user', 'search', 'check', 'close'];
}
