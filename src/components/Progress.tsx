import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import { resolveSemanticColor } from '../core/colorUtils';

// === Progress Types ===

export type ProgressVariant = 'linear' | 'circular';

export type ProgressStyle = ColorStyle &
  FlexChildStyle & {
    trackColor?: string;
    strokeWidth?: number;
    size?: number;
    width?: number;
    height?: number;
  };

export interface ProgressProps extends WidgetProps {
  /** Variant (default: linear) */
  variant?: ProgressVariant;
  /** 0..1, undefined = indeterminate */
  value?: number;
  /** Colors */
  color?: SemanticColor | string;
  /** Style override */
  style?: ProgressStyle;
}

/**
 * Progress — linear bar or circular spinner.
 * Equivalent to Flutter LinearProgressIndicator / CircularProgressIndicator.
 */
export const Progress = React.memo(function Progress({
  variant = 'linear',
  value,
  color,
  style,
}: ProgressProps) {
  const theme = useTheme();

  const resolvedColor = resolveSemanticColor(
    (color as SemanticColor) || 'primary',
    theme.colors
  );

  const trackBg = style?.trackColor ?? theme.colors.surfaceVariant;
  const isDeterminate = value != null;

  const width = style?.width ?? 200;
  const height = style?.height ?? 4;
  const size = style?.size ?? 48;
  const strokeW = style?.strokeWidth ?? 4;

  const widgetId = useWidgetId('Progress');
  const layout = useNativeYogaLayout(widgetId, { 
    width: variant === 'linear' ? width : size, 
    height: variant === 'linear' ? height : size 
  });
  
  const finalWidth = layout?.width > 0 ? layout.width : (typeof width === 'number' ? width : 200);

  if (variant === 'linear') {
    const fillWidth = isDeterminate
      ? finalWidth * Math.min(1, Math.max(0, value!))
      : finalWidth * 0.4;

    return (
      <Box
        id={widgetId}
        style={{
          width,
          height,
          backgroundColor: trackBg,
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            width: fillWidth,
            height: '100%',
            backgroundColor: resolvedColor,
            borderRadius: height / 2,
          }}
        />
      </Box>
    );
  }

  // === CIRCULAR ===
  // In V2 without Skia primitives, we simulate circular progress with a styled Box
  return (
    <Box
      id={widgetId}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeW,
        borderColor: trackBg,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box 
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeW,
          borderColor: resolvedColor,
          opacity: 0.5,
          position: 'absolute',
        }}
      />
    </Box>
  );
});

(Progress as any).skiaWidgetType = 'Progress';
