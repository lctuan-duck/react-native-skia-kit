import * as React from 'react';
import { Group, RoundedRect, Rect, Shadow } from '@shopify/react-native-skia';
import type { WidgetProps, HitTestBehavior, PanEvent } from '../core/types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useYogaLayout } from '../hooks/useYogaLayout';
import type { YogaFlexProps } from '../hooks/useYogaLayout';

export interface BoxProps extends WidgetProps, YogaFlexProps {
  /** Background color (default: 'transparent') */
  color?: string;
  /** Border radius */
  borderRadius?: number;
  /** Border color */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Elevation (shadow depth) */
  elevation?: number;
  /** Opacity 0-1 */
  opacity?: number;

  // === Box-specific flex child props (not in WidgetProps) ===
  /** Flex shrink */
  flexShrink?: number;
  /** Flex basis */
  flexBasis?: number | 'auto';
  /** Margin */
  margin?: number | [number, number, number, number];

  /** Hit test behavior */
  hitTestBehavior?: HitTestBehavior;
  /** z-index for hit test ordering */
  zIndex?: number;
  /** Overflow behavior: 'visible' (default) or 'hidden' (clips children) */
  overflow?: 'visible' | 'hidden';

  // === Events ===
  onPress?: () => void;
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
  accessibilityLabel?: string;
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
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  color = 'transparent',
  borderRadius = 0,
  borderColor = 'transparent',
  borderWidth = 0,
  elevation = 0,
  opacity = 1,
  hitTestBehavior = 'deferToChild',
  zIndex = 0,
  // Events
  onPress,
  onLongPress,
  onPanStart,
  onPanUpdate,
  onPanEnd,
  onLayout,
  // Overflow
  overflow = 'visible',
  // Flex container props
  flexDirection,
  flexWrap,
  justifyContent,
  alignItems,
  gap,
  rowGap,
  padding,
  // Flex child props (consumed by parent layout, not used here)
  flex: _flex,
  flexGrow: _flexGrow,
  flexShrink: _flexShrink,
  flexBasis: _flexBasis,
  alignSelf: _alignSelf,
  margin: _margin,
  position: _position,
  top: _top,
  left: _left,
  right: _right,
  bottom: _bottom,
  // Accessibility
  accessibilityLabel: _accessibilityLabel,
  accessibilityRole: _accessibilityRole,
  // Children
  children,
}: BoxProps) {
  const theme = useTheme();
  const bgColor = color;

  const widgetId = useWidget({
    type: 'Box',
    layout: { x, y, width, height },
  });

  // Register hit test for events
  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height },
    callbacks: { onPress, onLongPress, onPanStart, onPanUpdate, onPanEnd },
    behavior: hitTestBehavior,
    zIndex,
  });

  // Always call useYogaLayout (hooks must not be conditional).
  // When no flex props, it returns children unmodified.
  const flexProps: YogaFlexProps = {
    flexDirection,
    flexWrap,
    justifyContent,
    alignItems,
    gap,
    rowGap,
    padding,
  };

  const hasFlex = !!(
    flexDirection ||
    justifyContent ||
    alignItems ||
    gap != null
  );
  const result = useYogaLayout(
    widgetId,
    { x, y, width, height },
    hasFlex ? flexProps : {},
    hasFlex ? children : null
  );

  const renderedChildren = hasFlex ? result.renderedChildren : children;

  // Fire onLayout callback
  if (onLayout) {
    onLayout({ x, y, width, height });
  }

  const showBackground = bgColor !== 'transparent';
  const shouldClip = overflow === 'hidden';

  // Clip rect for overflow:'hidden'
  const clipRect = shouldClip
    ? borderRadius > 0
      ? { x, y, width, height, rx: borderRadius, ry: borderRadius }
      : { x, y, width, height }
    : undefined;

  return (
    <Group opacity={opacity} clip={clipRect}>
      {/* Shadow */}
      {elevation > 0 && (
        <Group>
          {borderRadius > 0 ? (
            <RoundedRect
              x={x}
              y={y}
              width={width}
              height={height}
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
              x={x}
              y={y}
              width={width}
              height={height}
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
            x={x}
            y={y}
            width={width}
            height={height}
            r={borderRadius}
            color={bgColor}
          />
        ) : (
          <Rect x={x} y={y} width={width} height={height} color={bgColor} />
        ))}

      {/* Border */}
      {borderWidth > 0 && borderColor !== 'transparent' && (
        <>
          {borderRadius > 0 ? (
            <RoundedRect
              x={x}
              y={y}
              width={width}
              height={height}
              r={borderRadius}
              color={borderColor}
              style="stroke"
              strokeWidth={borderWidth}
            />
          ) : (
            <Rect
              x={x}
              y={y}
              width={width}
              height={height}
              color={borderColor}
              style="stroke"
              strokeWidth={borderWidth}
            />
          )}
        </>
      )}

      {/* Children */}
      {renderedChildren}
    </Group>
  );
});
