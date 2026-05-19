import * as React from 'react';
import { useState, useCallback } from 'react';
import { Group, RoundedRect, Rect, Shadow } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withSpring,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import type {
  WidgetProps,
  HitTestBehavior,
  PanEvent,
} from '../types/widget.types';
import type {
  LayoutStyle,
  SpacingStyle,
  ColorStyle,
  BorderStyle,
  ShadowStyle,
  FlexChildStyle,
  FlexContainerStyle,
} from '../types/style.types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { RippleEffect } from './RippleEffect';
import { contrastColor, withOpacity } from '../core/colorUtils';
import { WidgetContext } from '../core/WidgetContext';

// === Box Style (component-specific, extends base groups) ===

export type BoxStyle = LayoutStyle &
  SpacingStyle &
  ColorStyle &
  BorderStyle &
  ShadowStyle &
  FlexChildStyle &
  FlexContainerStyle;

export interface BoxProps extends WidgetProps {
  /** Consolidated style prop */
  style?: BoxStyle;

  /** Hit test behavior */
  hitTestBehavior?: HitTestBehavior;

  /** Interactive variant wrapper */
  interactive?: 'ripple' | 'bounce' | 'opacity' | 'none';
  /** Manual ripple color override */
  rippleColor?: string;

  // === Events ===
  onPress?: (localX?: number, localY?: number) => void;
  onLongPress?: () => void;
  onPanStart?: (e: PanEvent) => void;
  onPanUpdate?: (e: PanEvent) => void;
  onPanEnd?: (e: PanEvent) => void;
  onLayout?: (layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;

  // === Accessibility ===
  accessibilityRole?: string;

  /** Children */
  children?: React.ReactNode;
}

/**
 * Box — base container widget.
 * Renders a rectangle (optionally rounded) on Skia canvas.
 * When flex props are provided, uses the JS flex layout engine
 * to calculate child positions automatically.
 *
 * Tương đương Flutter Container/DecoratedBox.
 */
export const Box = React.memo(function Box({
  id,
  x = 0,
  y = 0,
  style,
  hitTestBehavior = 'deferToChild',
  interactive = 'none',
  rippleColor,
  // Events
  onPress,
  onLongPress,
  onPanStart,
  onPanUpdate,
  onPanEnd,
  onLayout,
  // Accessibility
  accessibilityLabel: _accessibilityLabel,
  accessibilityRole: _accessibilityRole,
  // Children
  children,
}: BoxProps) {
  const theme = useTheme();

  // Destructure style with defaults
  const {
    // Layout
    width,
    height,
    overflow = 'visible',
    // Spacing
    padding,
    margin: _margin,
    // Color
    backgroundColor = 'transparent',
    opacity = 1,
    // Border
    borderRadius = 0,
    borderColor = 'transparent',
    borderWidth = 0,
    // Shadow
    elevation = 0,
    zIndex = 0,
    // Flex child (consumed by parent, not used here)
    flex: _flex,
    flexGrow: _flexGrow,
    flexShrink: _flexShrink,
    flexBasis: _flexBasis,
    alignSelf: _alignSelf,
    position: _position,
    top: _top,
    left: _left,
    right: _right,
    bottom: _bottom,
    // Flex container
    flexDirection,
    flexWrap,
    justifyContent,
    alignItems,
    gap,
    rowGap,
  } = style ?? {};

  const bgColor = backgroundColor;

  // Resolve width/height: strings like '100%' are handled by Yoga C++ engine.
  // Only use number values as JS fallback; for strings, let Yoga compute the final value.
  const w = typeof width === 'number' ? width : undefined;
  const h = typeof height === 'number' ? height : undefined;

  const defaultId = useWidget({
    type: 'Box',
    layout: { x, y, width: w ?? 0, height: h ?? 0 },
  });
  const widgetId = id ?? defaultId;

  // Interactive Animations (Hooks must be unconditional)
  const [ripples, setRipples] = useState<
    { id: string; x: number; y: number }[]
  >([]);
  const tapScale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  const groupOpacity = useDerivedValue(() => {
    return interactive === 'opacity' ? pressOpacity.value : opacity;
  }, [interactive, pressOpacity, opacity]);

  const groupTransform = useDerivedValue(() => {
    return [{ scale: tapScale.value }];
  }, [tapScale]);

  const restoreInteraction = useCallback(() => {
    if (interactive === 'bounce') {
      tapScale.value = withSpring(1, { stiffness: 400, damping: 20 });
    } else if (interactive === 'opacity') {
      pressOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [interactive, tapScale, pressOpacity]);

  const handlePanStart = useCallback(
    (e: PanEvent) => {
      if (interactive === 'bounce') {
        tapScale.value = withSpring(0.95, { stiffness: 400, damping: 20 });
      } else if (interactive === 'opacity') {
        pressOpacity.value = withTiming(0.6, { duration: 100 });
      } else if (interactive === 'ripple') {
        const newRipple = {
          id: Date.now().toString() + Math.random(),
          x: e.localX,
          y: e.localY,
        };
        setRipples((prev) => [...prev, newRipple]);
      }
      onPanStart?.(e);
    },
    [interactive, tapScale, pressOpacity, onPanStart]
  );

  const handlePanEnd = useCallback(
    (e: PanEvent) => {
      restoreInteraction();
      onPanEnd?.(e);
    },
    [restoreInteraction, onPanEnd]
  );

  const handlePress = useCallback(
    (localX?: number, localY?: number) => {
      restoreInteraction();
      onPress?.(localX, localY);
    },
    [restoreInteraction, onPress]
  );

  const layoutResult = useNativeYogaLayout(
    widgetId,
    {
      ...style,
      flexDirection,
      flexWrap,
      justifyContent,
      alignItems,
      gap,
      rowGap,
      padding,
      width: width ?? w,
      height: height ?? h,
    },
    children
  );

  const finalX = layoutResult?.x ?? x;
  const finalY = layoutResult?.y ?? y;
  const finalW = layoutResult?.width ?? w ?? 0;
  const finalH = layoutResult?.height ?? h ?? 0;

  // Register hit test for events
  useHitTest(widgetId, {
    rect: { left: finalX, top: finalY, width: finalW, height: finalH },
    callbacks: {
      onPress: handlePress,
      onLongPress,
      onPanStart: handlePanStart,
      onPanUpdate,
      onPanEnd: handlePanEnd,
    },
    behavior: hitTestBehavior,
    zIndex,
  });

  // Fire onLayout callback — inside useEffect to avoid side-effect in render
  React.useEffect(() => {
    if (onLayout) {
      onLayout({ x: finalX, y: finalY, width: finalW, height: finalH });
    }
  }, [onLayout, finalX, finalY, finalW, finalH]);

  const showBackground = bgColor !== 'transparent';
  const shouldClip = overflow === 'hidden';

  // Clip rect for overflow:'hidden'
  const clipRect = shouldClip
    ? borderRadius > 0
      ? {
          x: finalX,
          y: finalY,
          width: finalW,
          height: finalH,
          rx: borderRadius,
          ry: borderRadius,
        }
      : { x: finalX, y: finalY, width: finalW, height: finalH }
    : undefined;

  const calculatedRippleColor =
    rippleColor ??
    withOpacity(
      contrastColor(bgColor !== 'transparent' ? bgColor : theme.colors.surface),
      0.15
    );

  return (
    <Group
      opacity={groupOpacity}
      origin={{ x: finalX + finalW / 2, y: finalY + finalH / 2 }}
      transform={groupTransform}
      clip={clipRect}
    >
      {/* Shadow */}
      {elevation > 0 && (
        <Group>
          {borderRadius > 0 ? (
            <RoundedRect
              x={finalX}
              y={finalY}
              width={finalW}
              height={finalH}
              r={borderRadius}
              color={showBackground ? bgColor : theme.colors.surface}
            >
              <Shadow
                dx={0}
                dy={elevation / 2}
                blur={elevation * 2}
                color="rgba(0,0,0,0.2)"
              />
            </RoundedRect>
          ) : (
            <Rect
              x={finalX}
              y={finalY}
              width={finalW}
              height={finalH}
              color={showBackground ? bgColor : theme.colors.surface}
            >
              <Shadow
                dx={0}
                dy={elevation / 2}
                blur={elevation * 2}
                color="rgba(0,0,0,0.2)"
              />
            </Rect>
          )}
        </Group>
      )}

      {/* Background — only render when color is not transparent */}
      {elevation === 0 &&
        showBackground &&
        (borderRadius > 0 ? (
          <RoundedRect
            x={finalX}
            y={finalY}
            width={finalW}
            height={finalH}
            r={borderRadius}
            color={bgColor}
          />
        ) : (
          <Rect
            x={finalX}
            y={finalY}
            width={finalW}
            height={finalH}
            color={bgColor}
          />
        ))}

      {/* Ripple Animation Layer - Clipped strictly to bounds */}
      {interactive === 'ripple' && ripples.length > 0 && (
        <Group
          clip={{
            x: finalX,
            y: finalY,
            width: finalW,
            height: finalH,
            rx: borderRadius,
            ry: borderRadius,
          }}
        >
          {ripples.map((r) => (
            <RippleEffect
              key={r.id}
              x={finalX + r.x}
              y={finalY + r.y}
              boundsWidth={finalW}
              boundsHeight={finalH}
              color={calculatedRippleColor}
              onComplete={() =>
                setRipples((prev) => prev.filter((p) => p.id !== r.id))
              }
            />
          ))}
        </Group>
      )}

      {/* Border */}
      {borderWidth > 0 && borderColor !== 'transparent' && (
        <>
          {borderRadius > 0 ? (
            <RoundedRect
              x={finalX}
              y={finalY}
              width={finalW}
              height={finalH}
              r={borderRadius}
              color={borderColor}
              style="stroke"
              strokeWidth={borderWidth}
            />
          ) : (
            <Rect
              x={finalX}
              y={finalY}
              width={finalW}
              height={finalH}
              color={borderColor}
              style="stroke"
              strokeWidth={borderWidth}
            />
          )}
        </>
      )}

      {/* Children */}
      <WidgetContext.Provider value={widgetId}>
        {children}
      </WidgetContext.Provider>
    </Group>
  );
});

(Box as any).skiaWidgetType = 'Box';
