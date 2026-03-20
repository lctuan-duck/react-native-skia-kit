import React from 'react';
import { Canvas } from '@shopify/react-native-skia';
import type { ViewStyle } from 'react-native';

interface CanvasRootProps {
  /** Style cho Canvas container */
  style?: ViewStyle;
  /** Widget tree */
  children?: React.ReactNode;
}

/**
 * CanvasRoot — Root canvas duy nhất cho toàn bộ ứng dụng.
 * Tương đương Flutter MaterialApp — wrap tất cả widgets.
 *
 * Usage:
 * ```tsx
 * <CanvasRoot style={{ width, height }}>
 *   <Box ... />
 *   <Text ... />
 * </CanvasRoot>
 * ```
 */
export const CanvasRoot = React.memo(function CanvasRoot({
  style,
  children,
}: CanvasRootProps) {
  return <Canvas style={style}>{children}</Canvas>;
});
