import * as React from 'react';
import { useState, useCallback } from 'react';
import { Box } from './Box';
import { Progress } from './Progress';
import { useWidgetId } from '../hooks/useWidgetId';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';

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
  children,
  onRefresh,
  color = 'primary',
  displacement = 40,
  screenWidth,
  style,
  ...props
}: RefreshIndicatorProps) {
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const containerWidth = style?.width ?? screenWidth ?? 360;
  const spinnerX = x + (typeof containerWidth === 'number' ? containerWidth : 360) / 2 - 14; 
  const [refreshing, setRefreshing] = useState(false);

  useWidgetId('RefreshIndicator');

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
    <Box style={{ width: '100%', height: '100%' }}>
      {refreshing && (
        <Progress
          variant="circular"
          x={spinnerX}
          y={y + displacement}
          color={color}
          style={{ width: 28, height: 28 }}
        />
      )}
      {children}
    </Box>
  );
});

(RefreshIndicator as any).skiaWidgetType = 'RefreshIndicator';
