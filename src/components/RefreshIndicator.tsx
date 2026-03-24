import * as React from 'react';
import { useState, useCallback } from 'react';
import { Group } from '@shopify/react-native-skia';
import { Progress } from './Progress';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../core/style.types';

// === RefreshIndicator Types ===

export type RefreshIndicatorStyle = ColorStyle &
  FlexChildStyle & {
    width?: number;
  };

export interface RefreshIndicatorProps extends WidgetProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  /** Semantic color for the spinner */
  color?: SemanticColor;
  /** Displacement from top (default: 40) */
  displacement?: number;
  /** Screen width for centering indicator */
  screenWidth?: number;
  /** Style override */
  style?: RefreshIndicatorStyle;
}

/**
 * RefreshIndicator — shows circular Progress spinner during refresh.
 * Pull gesture requires GestureDetector integration.
 * Tương đương Flutter RefreshIndicator.
 */
export const RefreshIndicator = React.memo(function RefreshIndicator({
  x = 0,
  y = 0,
  children,
  onRefresh,
  color = 'primary',
  displacement = 40,
  screenWidth,
  style,
}: RefreshIndicatorProps) {
  const containerWidth = style?.width ?? screenWidth ?? 360;
  const spinnerX = x + containerWidth / 2 - 14; // center the 28px spinner
  const [refreshing, setRefreshing] = useState(false);

  useWidget({
    type: 'RefreshIndicator',
    layout: { x, y, width: containerWidth, height: displacement + 28 },
  });

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, onRefresh]);

  // Expose handleRefresh for external trigger
  void handleRefresh;

  return (
    <Group>
      {refreshing && (
        <Progress
          variant="circular"
          x={spinnerX}
          y={y + displacement}
          colors={[color]}
          style={{ size: 28 }}
        />
      )}
      {children}
    </Group>
  );
});
