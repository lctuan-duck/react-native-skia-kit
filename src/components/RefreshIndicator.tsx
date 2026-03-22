import * as React from 'react';
import { useState, useCallback } from 'react';
import { Group } from '@shopify/react-native-skia';
import { Progress } from './Progress';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface RefreshIndicatorProps extends WidgetProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  color?: string;
  backgroundColor?: string;
  displacement?: number;
  /** Screen width for centering indicator */
  screenWidth?: number;
}

/**
 * RefreshIndicator — shows circular Progress spinner during refresh.
 * Pull gesture requires GestureDetector integration.
 * Tương đương Flutter RefreshIndicator.
 */
export const RefreshIndicator = React.memo(function RefreshIndicator({
  x = 0,
  y = 0,
  width,
  children,
  onRefresh,
  color,
  displacement = 40,
  screenWidth,
}: RefreshIndicatorProps) {
  const theme = useTheme();
  const spinnerColor = color ?? theme.colors.primary;
  const [refreshing, setRefreshing] = useState(false);
  const containerWidth = width ?? screenWidth ?? 360;
  const spinnerX = x + containerWidth / 2 - 14; // center the 28px spinner

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
          size={28}
          color={spinnerColor}
        />
      )}
      {children}
    </Group>
  );
});
