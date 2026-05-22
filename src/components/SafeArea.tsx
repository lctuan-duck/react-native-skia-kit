import * as React from 'react';
import { Platform, StatusBar } from 'react-native';

import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import type {
  LayoutStyle,
  SpacingStyle,
  ColorStyle,
  FlexContainerStyle,
  FlexChildStyle,
} from '../types/style.types';

// === SafeArea Types ===

export type SafeAreaStyle = LayoutStyle &
  SpacingStyle &
  ColorStyle &
  FlexChildStyle &
  Pick<
    FlexContainerStyle,
    'flexDirection' | 'justifyContent' | 'alignItems' | 'gap'
  >;

export interface SafeAreaProps extends WidgetProps {
  children: React.ReactNode;
  /** Which edges to respect (default: all) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Custom insets override (auto-detected from Platform if omitted) */
  insets?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Style override (width, height, backgroundColor, flexDirection, padding, gap, etc.) */
  style?: SafeAreaStyle;
}

/**
 * SafeArea — avoids system UI (notch, status bar, home indicator).
 * Equivalent to Flutter SafeArea widget.
 *
 * Uses Platform defaults for insets. Pass custom `insets` prop to override.
 *
 * @example
 * <SafeArea x={0} y={0} style={{ width: '100%', height: '100%' }}>
 *   <Box ...>
 *     <Text text="Content below status bar" />
 *   </Box>
 * </SafeArea>
 */
export const SafeArea = React.memo(function SafeArea({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  insets: customInsets,
  style,
}: SafeAreaProps) {
  const width = style?.width ?? '100%';
  const height = style?.height ?? '100%';
  const bgColor = style?.backgroundColor ?? 'transparent';

  // Platform-based defaults
  const defaultTop = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 24;
  const defaultBottom = Platform.OS === 'ios' ? 34 : 0;

  const insets = {
    top: customInsets?.top ?? defaultTop,
    bottom: customInsets?.bottom ?? defaultBottom,
    left: customInsets?.left ?? 0,
    right: customInsets?.right ?? 0,
  };

  const safeTop = edges.includes('top') ? insets.top : 0;
  const safeBottom = edges.includes('bottom') ? insets.bottom : 0;
  const safeLeft = edges.includes('left') ? insets.left : 0;
  const safeRight = edges.includes('right') ? insets.right : 0;

  return (
    <Box
      style={{
        ...style,
        width,
        height,
        backgroundColor: bgColor,
        paddingTop: safeTop,
        paddingBottom: safeBottom,
        paddingLeft: safeLeft,
        paddingRight: safeRight,
      }}
    >
      {children}
    </Box>
  );
});

(SafeArea as any).skiaWidgetType = 'SafeArea';
