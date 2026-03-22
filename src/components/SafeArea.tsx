import * as React from 'react';
import { Platform, StatusBar } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { Box } from './Box';
import type { WidgetProps } from '../core/types';
import type { YogaFlexProps } from '../hooks/useYogaLayout';

export interface SafeAreaProps extends WidgetProps, YogaFlexProps {
  children: React.ReactNode;
  /** Which edges to respect (default: all) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Background color */
  color?: string;
  /** Custom insets override (auto-detected from Platform if omitted) */
  insets?: { top?: number; bottom?: number; left?: number; right?: number };
}

/**
 * SafeArea — avoids system UI (notch, status bar, home indicator).
 * Equivalent to Flutter SafeArea widget.
 *
 * Uses Platform defaults for insets. Pass custom `insets` prop to override.
 *
 * @example
 * <SafeArea x={0} y={0} width={360} height={800}>
 *   <Box ...>
 *     <Text text="Content below status bar" />
 *   </Box>
 * </SafeArea>
 */
export const SafeArea = React.memo(function SafeArea({
  x = 0,
  y = 0,
  width = 360,
  height = 800,
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  color = 'transparent',
  insets: customInsets,
  // Flex props
  flexDirection,
  justifyContent,
  alignItems,
  gap,
  padding,
}: SafeAreaProps) {
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

  const safeX = x + safeLeft;
  const safeY = y + safeTop;
  const safeWidth = width - safeLeft - safeRight;
  const safeHeight = height - safeTop - safeBottom;

  return (
    <Group>
      {/* Background fill for entire area */}
      {color !== 'transparent' && (
        <Box x={x} y={y} width={width} height={height} color={color} />
      )}
      {/* Content in safe area */}
      <Box
        x={safeX}
        y={safeY}
        width={safeWidth}
        height={safeHeight}
        flexDirection={flexDirection}
        justifyContent={justifyContent}
        alignItems={alignItems}
        gap={gap}
        padding={padding}
      >
        {children}
      </Box>
    </Group>
  );
});
