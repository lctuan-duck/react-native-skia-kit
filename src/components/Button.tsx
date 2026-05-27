import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '../hooks/useTheme';
import { useWidgetId } from '../hooks/useWidgetId';
import type { WidgetProps } from '../types/widget.types';
import type {
  LayoutStyle,
  ColorStyle,
  BorderStyle,
  ShadowStyle,
  SpacingStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import {
  resolveSemanticColor,
  resolveOnColor,
  withOpacity,
} from '../utils/color';
import { useEngineContext } from '../core/EngineContext';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';


// === Button Types ===

export type ButtonVariant =
  | 'solid'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'icon'
  | 'fab';

export type ButtonStyle = LayoutStyle &
  ColorStyle &
  BorderStyle &
  ShadowStyle &
  SpacingStyle &
  FlexChildStyle & {
    textColor?: string;
    iconSize?: number;
    tapSize?: number;
  };

export interface ButtonProps extends WidgetProps {
  /** Label text */
  text?: string;
  /** Icon name */
  icon?: string;
  /** Variant = SHAPE */
  variant?: ButtonVariant;
  /** Semantic color (resolves via theme) */
  color?: SemanticColor;
  /** Disabled state */
  disabled?: boolean;
  /** FAB extended mode (icon + label) */
  extended?: boolean;
  /**
   * Interactive press effect.
   * - `'opacity'`  — dims to 60% opacity on press (default)
   * - `'bounce'`   — scales down to 0.94 on press, springs back on release
   * - `'ripple'`   — fast opacity flash simulating ripple (full GPU ripple requires C++ arc draw)
   * - `'none'`     — no visual feedback
   */
  interactive?: 'ripple' | 'bounce' | 'opacity' | 'none';
  /** Press callback */
  onPress?: (localX?: number, localY?: number) => void;
  /** Long press callback */
  onLongPress?: () => void;
  /** Style override (highest priority) */
  style?: ButtonStyle;
}

/**
 * Button — multi-variant button.
 * Tương đương Flutter ElevatedButton / FilledButton / TextButton / IconButton / FAB.
 *
 * Variant = SHAPE (solid/outline/ghost/link/icon/fab)
 * Color = SEMANTIC (primary/secondary/success/info/warning/error/neutral)
 * → 2 trục độc lập, kết hợp tự do.
 */
export const Button = React.memo(function Button({
  text,
  icon,
  variant = 'solid',
  color = 'primary',
  disabled = false,
  extended = false,
  interactive = 'opacity',
  onPress,
  onLongPress,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const resolvedColor = resolveSemanticColor(color, theme.colors);
  const resolvedOnColor = resolveOnColor(color, theme.colors);
  const variantStyles = resolveVariantStyles(
    variant,
    resolvedColor,
    resolvedOnColor,
    theme
  );

  const widgetId = useWidgetId('Button');
  const { engine, engineId } = useEngineContext();

  // WORKLET-SAFE: useCallback + runOnJS thay vì mutable ref
  const updateButtonUI = React.useCallback(
    (id: string, eff: string, isP: number) => {
      if (eff === 'opacity' || eff === 'ripple') {
        engine.updateAnimatedStyles(id, { opacity: isP ? 0.6 : 1.0 });
      } else if (eff === 'bounce') {
        const s = isP ? 0.94 : 1.0;
        engine.updateAnimatedStyles(id, { scaleX: s, scaleY: s });
      }
    },
    [engine]
  );

  // ── Interactive press effects ─────────────────────────────────────────────────────
  // `pressed` SharedValue: 0 = released, 1 = pressed
  const pressed = useSharedValue(0);

  useAnimatedReaction(
    () => pressed.value,
    (p) => {
      'worklet';
      // Guard: 'none' has no effect
      if (!interactive || interactive === 'none') return;
      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        // Direct worklet→C++ path — no JS thread hop → butter smooth
        if (interactive === 'opacity' || interactive === 'ripple') {
          direct.updateAnimatedStyles(widgetId, { opacity: p > 0 ? 0.6 : 1.0 });
        } else if (interactive === 'bounce') {
          const s = p > 0 ? 0.94 : 1.0;
          direct.updateAnimatedStyles(widgetId, { scaleX: s, scaleY: s });
        }
      } else {
        runOnJS(updateButtonUI)(widgetId, interactive, p);
      }
    },
    [widgetId, interactive, engineId, updateButtonUI]
  );

  const handlePressIn = () => {
    if (disabled) return;
    pressed.value = withTiming(1, { duration: 80 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 150 });
  };

  const handlePress = (localX?: number, localY?: number) => {
    if (disabled) return;
    onPress?.(localX, localY);
  };

  // Style overrides take highest priority
  const bgColor = style?.backgroundColor ?? variantStyles.background;
  const fgColor = style?.textColor ?? variantStyles.foreground;
  const borderW = style?.borderWidth ?? variantStyles.borderWidth;
  const borderC = style?.borderColor ?? variantStyles.borderColor;
  const elev = style?.elevation ?? variantStyles.elevation;
  const borderR = style?.borderRadius ?? 8;
  const iconSz = style?.iconSize ?? 20;
  const tapSz = style?.tapSize ?? 48;

  const w = style?.width;
  const h = style?.height ?? 48;

  // ===== Icon-only variant =====
  if (variant === 'icon') {
    return (
      <Box
        id={widgetId}
        style={{
          width: tapSz,
          height: tapSz,
          borderRadius: tapSz / 2,
          backgroundColor: style?.backgroundColor ?? 'transparent',
          opacity: disabled ? 0.4 : 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        hitTestBehavior="opaque"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={(x, y) => handlePress(x, y)}
        onLongPress={onLongPress}
      >
        <Icon name={icon ?? 'circle'} size={iconSz} color={fgColor} />
      </Box>
    );
  }

  // ===== FAB variant =====
  if (variant === 'fab') {
    const fabWidth = extended ? w ?? 140 : 56;
    return (
      <Box
        id={widgetId}
        style={{
          width: fabWidth,
          height: 56,
          borderRadius: 28,
          backgroundColor: bgColor,
          elevation: elev,
          opacity: disabled ? 0.4 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: extended ? [0, 20, 0, 16] : 0,
          gap: extended ? 8 : 0,
        }}
        hitTestBehavior="opaque"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={(x, y) => handlePress(x, y)}
        onLongPress={onLongPress}
      >
        <Icon name={icon ?? 'circle'} size={24} color={fgColor} />
        {extended && text && (
          <Text
            text={text}
            style={{ fontSize: 14, fontWeight: 'bold', color: fgColor }}
          />
        )}
      </Box>
    );
  }

  // ===== Standard variants: solid / outline / ghost / link =====
  const btnWidth = w ?? undefined; // Let Yoga compute width; user can set via style.width
  return (
    <Box
      id={widgetId}
      style={{
        width: btnWidth,
        minWidth: 80,
        height: h,
        borderRadius: borderR,
        backgroundColor: bgColor,
        borderWidth: borderW,
        borderColor: borderC,
        elevation: elev,
        opacity: disabled ? 0.4 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: style?.padding ?? [0, 16, 0, 16],
        gap: icon && text ? 8 : 0,
      }}
      hitTestBehavior="opaque"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={(x, y) => handlePress(x, y)}
      onLongPress={onLongPress}
    >
      {icon && <Icon name={icon} size={iconSz} color={fgColor} />}
      {text && (
        <Text
          text={text}
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: fgColor,
            textAlign: 'center',
          }}
        />
      )}
    </Box>
  );
});

// Variant → style resolution
function resolveVariantStyles(
  variant: ButtonVariant,
  color: string,
  onColor: string,
  _theme: ReturnType<typeof useTheme>
) {
  switch (variant) {
    case 'solid':
      return {
        background: color,
        foreground: onColor,
        elevation: 2,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'ghost':
      return {
        background: withOpacity(color, 0.15),
        foreground: color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'outline':
      return {
        background: 'transparent',
        foreground: color,
        elevation: 0,
        borderWidth: 1,
        borderColor: color,
      };
    case 'link':
      return {
        background: 'transparent',
        foreground: color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'icon':
      return {
        background: 'transparent',
        foreground: color,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'fab':
      return {
        background: color,
        foreground: onColor,
        elevation: 6,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    default:
      return {
        background: color,
        foreground: onColor,
        elevation: 2,
        borderWidth: 0,
        borderColor: 'transparent',
      };
  }
}

(Button as any).skiaWidgetType = 'Button';