import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import { resolveSemanticColor, parseColor } from '../core/colorUtils';
import { uiEngine } from '../core/GlobalEngine';
import { useSharedValue, withTiming, useAnimatedReaction, interpolateColor } from 'react-native-reanimated';

// === Radio Types ===

export type RadioStyle = ColorStyle & BorderStyle & FlexChildStyle;

export interface RadioProps extends WidgetProps {
  /** Size (default: 24) */
  size?: number;
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Semantic color */
  color?: SemanticColor;
  /** Style override */
  style?: RadioStyle;
  /** Change callback */
  onChange?: (selected: boolean) => void;
  /** Press callback */
  onPress?: () => void;
}

/**
 * Radio — single selection within a group.
 * Equivalent to Flutter Radio.
 */
export const Radio = React.memo(function Radio({
  size = 24,
  selected = false,
  disabled = false,
  color = 'primary',
  style,
  onChange,
  onPress,
}: RadioProps) {
  const theme = useTheme();
  const activeColor =
    style?.backgroundColor ?? resolveSemanticColor(color, theme.colors);
  const r = size / 2;
  
  const uncheckedBorderColor = theme.colors.outline;
  const disabledBorderColor = theme.colors.textDisabled;
  
  const targetBorderColor = disabled
    ? disabledBorderColor
    : selected
    ? activeColor
    : uncheckedBorderColor;
    
  const dotColor = disabled ? disabledBorderColor : activeColor;

  const handlePress = () => {
    if (disabled) return;
    onChange?.(!selected);
    onPress?.();
  };

  const widgetId = useWidgetId('Radio');
  const dotId = useWidgetId('RadioDot');
  
  const borderWidth = style?.borderWidth ?? 2;
  const maxDotSize = size * 0.5;

  const progress = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected, progress]);

  // Use Worklet to directly update UIEngine for smooth 60fps animations
  useAnimatedReaction(
    () => progress.value,
    (p) => {
      const currentBorder = interpolateColor(
        p,
        [0, 1],
        [disabled ? disabledBorderColor : uncheckedBorderColor, disabled ? disabledBorderColor : activeColor]
      );
      
      const currentDotSize = p * maxDotSize;

      // Update Box border color
      uiEngine.updateBoxNode(
        widgetId, 
        {}, 
        { 
          backgroundColor: 0, // transparent
          borderColor: parseColor(currentBorder),
          borderRadius: r,
          borderWidth: borderWidth,
        }
      );
      
      // Update Dot size via LayoutNode
      uiEngine.updateLayoutNode(
        dotId,
        { 
          width: currentDotSize,
          height: currentDotSize,
        }
      );
      
      // Also update Dot border radius
      uiEngine.updateBoxNode(
        dotId,
        {},
        {
          backgroundColor: parseColor(dotColor),
          borderRadius: currentDotSize / 2,
        }
      );
    },
    [activeColor, disabledBorderColor, uncheckedBorderColor, disabled, widgetId, dotId, r, borderWidth, maxDotSize, dotColor]
  );

  return (
    <Box
      id={widgetId}
      style={{
        width: size,
        height: size,
        backgroundColor: 'transparent',
        borderRadius: r,
        borderWidth: borderWidth,
        borderColor: targetBorderColor,
        opacity: disabled ? 0.5 : 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      hitTestBehavior="translucent"
      onPress={handlePress}
    >
      <Box 
        id={dotId}
        style={{
          width: selected ? maxDotSize : 0,
          height: selected ? maxDotSize : 0,
          borderRadius: selected ? maxDotSize / 2 : 0,
          backgroundColor: dotColor,
        }}
      />
    </Box>
  );
});

(Radio as any).skiaWidgetType = 'Radio';
