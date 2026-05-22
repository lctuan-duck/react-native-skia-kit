import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
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
  /** Step value for snapping (default is 1) */
  step?: number;
  /** Change callback */
  onChange?: (value: number) => void;
  /** Callback fired when the user releases the slider */
  onSlidingComplete?: (value: number) => void;
}

/**
 * Slider — continuous value selection via draggable thumb.
 * Equivalent to Flutter Slider.
 */
export const Slider = React.memo(function Slider({
  min = 0,
  max = 100,
  value = 0,
  step = 1,
  color = 'primary',
  disabled = false,
  style,
  onChange,
  onSlidingComplete,
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
  
  const layout = useNativeYogaLayout(widgetId, { width, height: totalHeight });
  const finalWidth = layout?.width > 0 ? layout.width : (typeof width === 'number' ? width : 200);

  const [internalValue, setInternalValue] = React.useState(value);
  const isDragging = React.useRef(false);

  React.useEffect(() => {
    if (!isDragging.current) {
      setInternalValue(value);
    }
  }, [value]);

  const ratio = Math.max(0, Math.min(1, (internalValue - min) / (max - min)));
  const fillWidth = ratio * finalWidth;
  const thumbCx = ratio * finalWidth;

  const calculateValue = (localX: number) => {
    const rawValue = min + (localX / finalWidth) * (max - min);
    let newValue = Math.max(min, Math.min(max, rawValue));
    if (step > 0) {
      newValue = Math.round((newValue - min) / step) * step + min;
    }
    return newValue;
  };

  const handlePanStart = (e: PanEvent) => {
    if (disabled) return;
    isDragging.current = true;
    const newValue = calculateValue(e?.localX ?? 0);
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handlePanUpdate = (e: PanEvent) => {
    if (disabled) return;
    const newValue = calculateValue(e?.localX ?? 0);
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handlePanEnd = () => {
    isDragging.current = false;
    onSlidingComplete?.(internalValue);
  };

  return (
    <Box
      id={widgetId}
      style={{
        width,
        height: totalHeight,
        backgroundColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
        justifyContent: 'center',
      }}
      hitTestBehavior="opaque"
      onPanStart={handlePanStart}
      onPanUpdate={handlePanUpdate}
      onPanEnd={handlePanEnd}
    >
      {/* Track background */}
      <Box
        style={{
          width: '100%',
          height: trackH,
          borderRadius: trackH / 2,
          backgroundColor: trackBg,
          position: 'absolute',
        }}
      />

      {/* Active fill */}
      <Box
        style={{
          width: fillWidth,
          height: trackH,
          borderRadius: trackH / 2,
          backgroundColor: activeColor,
          position: 'absolute',
        }}
      />

      {/* Thumb */}
      <Box
        style={{
          width: thumbR * 2,
          height: thumbR * 2,
          borderRadius: thumbR,
          backgroundColor: thumbClr,
          borderWidth: 2,
          borderColor: activeColor,
          position: 'absolute',
          left: thumbCx - thumbR,
        }}
      />
    </Box>
  );
});

(Slider as any).skiaWidgetType = 'Slider';
