import * as React from 'react';
import { Circle, RoundedRect } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useLayoutStore } from '../stores/layoutStore';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps, PanEvent } from '../types/widget.types';
import type {
  ColorStyle,
  FlexChildStyle,
  SemanticColor,
  LayoutStyle,
} from '../types/style.types';
import { resolveSemanticColor } from '../core/colorUtils';

// === Slider Types ===

export type SliderStyle = ColorStyle &
  FlexChildStyle &
  LayoutStyle & {
    trackColor?: string;
    thumbColor?: string;
  };

export interface SliderProps extends WidgetProps {
  /** Min value */
  min?: number;
  /** Max value */
  max?: number;
  /** Current value */
  value?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: SliderStyle;
  /** Change callback */
  onChange?: (value: number) => void;
}

/**
 * Slider — continuous value selection via draggable thumb.
 * Equivalent to Flutter Slider.
 */
export const Slider = React.memo(function Slider({
  x = 0,
  y = 0,
  min = 0,
  max = 100,
  value = 0,
  color = 'primary',
  disabled = false,
  style,
  onChange,
}: SliderProps) {
  const theme = useTheme();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
  const trackBg = style?.trackColor ?? theme.colors.surfaceVariant;
  const thumbClr = style?.thumbColor ?? 'white';
  const width = style?.width ?? 200;

  const trackH = 6;
  const thumbR = 12;
  const totalHeight = thumbR * 2;
  const widgetId = useWidgetId('Slider');
  const layout = useLayoutStore((s) => s.layoutMap[widgetId]);
  const finalX = layout?.rect.x ?? x;
  const finalY = layout?.rect.y ?? y;
  const finalWidth = layout?.rect.width ?? (typeof width === 'number' ? width : 200);

  const ratio = (value - min) / (max - min);
  const fillWidth = ratio * finalWidth;
  const trackY = finalY + thumbR - trackH / 2;

  const thumbCx = useDerivedValue(() => {
    return finalX + ratio * finalWidth;
  }, [value, finalX, finalWidth, min, max]);

  const handlePanUpdate = (e: PanEvent) => {
    if (disabled) return;
    const newValue = Math.min(
      max,
      Math.max(min, min + (((e?.absoluteX ?? 0) - x) / finalWidth) * (max - min))
    );
    onChange?.(Math.round(newValue));
  };

  return (
    <Box
      id={widgetId}
      x={x}
      y={y}
      style={{
        width,
        height: totalHeight,
        backgroundColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
      }}
      hitTestBehavior="opaque"
      onPanUpdate={handlePanUpdate}
    >
      {/* Track background */}
      <RoundedRect
        x={finalX}
        y={trackY}
        width={finalWidth}
        height={trackH}
        r={trackH / 2}
        color={trackBg}
      />

      {/* Active fill */}
      <RoundedRect
        x={finalX}
        y={trackY}
        width={Math.max(0, fillWidth)}
        height={trackH}
        r={trackH / 2}
        color={activeColor}
      />

      {/* Thumb */}
      <Circle cx={thumbCx} cy={finalY + thumbR} r={thumbR} color={thumbClr} />
      <Circle
        cx={thumbCx}
        cy={finalY + thumbR}
        r={thumbR}
        color={activeColor}
        style="stroke"
        strokeWidth={2}
      />
    </Box>
  );
});

(Slider as any).skiaWidgetType = 'Slider';
