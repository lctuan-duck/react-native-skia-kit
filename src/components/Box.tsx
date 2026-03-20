import React from 'react';
import { Group, RoundedRect, Rect, Shadow } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';
import type { WidgetProps, HitTestBehavior } from '../core/types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';

export interface BoxProps extends WidgetProps {
  /** Background color */
  color?: string;
  /** Border radius — number or [topLeft, topRight, bottomRight, bottomLeft] */
  borderRadius?: number;
  /** Border color */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Elevation (shadow depth) */
  elevation?: number;
  /** Opacity 0-1 */
  opacity?: number;
  /** Hit test behavior */
  hitTestBehavior?: HitTestBehavior;
  /** Press callback */
  onPress?: () => void;
  /** Children */
  children?: React.ReactNode;
}

/**
 * Box — base container widget.
 * Renders a rectangle (optionally rounded) on Skia canvas.
 * Tương đương Flutter Container/DecoratedBox.
 */
export const Box = React.memo(function Box({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  color,
  borderRadius = 0,
  borderColor,
  borderWidth = 0,
  elevation = 0,
  opacity = 1,
  children,
}: BoxProps) {
  const theme = useTheme();
  const bgColor = color ?? theme.colors.surface;

  useWidget({
    type: 'Box',
    layout: { x, y, width, height },
  });

  const paint = Skia.Paint();
  paint.setColor(Skia.Color(bgColor));

  return (
    <Group opacity={opacity}>
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
              color={bgColor}
            >
              <Shadow
                dx={0}
                dy={elevation / 2}
                blur={elevation}
                color={theme.colors.shadow}
              />
            </RoundedRect>
          ) : (
            <Rect
              x={x}
              y={y}
              width={width}
              height={height}
              color={bgColor}
            >
              <Shadow
                dx={0}
                dy={elevation / 2}
                blur={elevation}
                color={theme.colors.shadow}
              />
            </Rect>
          )}
        </Group>
      )}

      {/* Background */}
      {elevation === 0 &&
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
      {borderWidth > 0 && borderColor && (
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
      {children}
    </Group>
  );
});
