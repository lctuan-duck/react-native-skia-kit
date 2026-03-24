import * as React from 'react';
import { useMemo } from 'react';
import { Skia, Paragraph, TextAlign, Group } from '@shopify/react-native-skia';
import type { SkParagraphStyle } from '@shopify/react-native-skia';
import type { WidgetProps, HitTestBehavior } from '../core/types';
import type { SkiaTextStyle, FlexChildStyle } from '../core/style.types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';

// === Ellipsis mode ===

export type EllipsisMode = 'none' | 'tail' | 'head' | 'middle' | 'clip';

// === Text Style (component-specific, extends base groups) ===

export type TextComponentStyle = SkiaTextStyle &
  FlexChildStyle & {
    opacity?: number;
    numberOfLines?: number;
    ellipsis?: EllipsisMode;
    width?: number;
    height?: number;
  };

export interface TextProps extends WidgetProps {
  /** Text content */
  text?: string;
  /** Consolidated style prop */
  style?: TextComponentStyle;
  /** Hit test behavior */
  hitTestBehavior?: HitTestBehavior;
  /** Press callback */
  onPress?: () => void;
  /** Long press callback */
  onLongPress?: () => void;
  /** Children (string content) */
  children?: string;
}

// Map fontWeight string to Skia numeric weight
function toSkiaFontWeight(weight: string): number {
  const map: Record<string, number> = {
    normal: 400,
    bold: 700,
    '100': 100,
    '200': 200,
    '300': 300,
    '400': 400,
    '500': 500,
    '600': 600,
    '700': 700,
    '800': 800,
    '900': 900,
  };
  return map[weight] ?? 400;
}

// Resolve ellipsis mode to Skia paragraph ellipsis string
function resolveEllipsis(mode: EllipsisMode | undefined): string | undefined {
  switch (mode) {
    case 'tail':
      return '…';
    case 'head':
      return '…'; // Skia only supports tail natively; head/middle approximated
    case 'middle':
      return '…';
    case 'clip':
      return ''; // empty string clips without ellipsis char
    case 'none':
    default:
      return undefined;
  }
}

/**
 * Text — renders text on Skia canvas using Paragraph API.
 * Equivalent to Flutter Text widget.
 *
 * IMPORTANT: paragraphStyle must not contain `undefined` values
 * for numeric fields — Skia native crashes on "Value is undefined,
 * expected a number". This was the bug we fixed previously.
 */
export const Text = React.memo(function SkiaText({
  x = 0,
  y = 0,
  style,
  hitTestBehavior = 'deferToChild',
  onPress,
  onLongPress,
  text,
  children,
}: TextProps) {
  const theme = useTheme();

  // Destructure style with defaults
  const {
    fontSize = 14,
    fontFamily,
    fontWeight = 'normal',
    fontStyle = 'normal',
    color,
    opacity = 1,
    textAlign = 'left',
    numberOfLines,
    ellipsis = 'none',
    lineHeight,
    letterSpacing,
    width = 300,
    height,
    // Flex child props (consumed by parent, not used here)
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
  } = style ?? {};

  const textColor = color ?? theme.colors.textBody;
  const content = text ?? (typeof children === 'string' ? children : '') ?? '';
  const family = fontFamily ?? theme.typography.fontFamily;

  const paragraph = useMemo(() => {
    const alignMap: Record<string, TextAlign> = {
      center: TextAlign.Center,
      right: TextAlign.Right,
      left: TextAlign.Left,
    };

    const ellipsisStr = resolveEllipsis(ellipsis);

    const paragraphStyle: SkParagraphStyle = {
      textAlign: alignMap[textAlign] ?? TextAlign.Left,
      ...(numberOfLines != null && numberOfLines > 0
        ? { maxLines: numberOfLines }
        : {}),
      ...(ellipsisStr != null ? { ellipsis: ellipsisStr } : {}),
    };

    const skTextStyle: Record<string, unknown> = {
      color: Skia.Color(textColor),
      fontSize,
      fontFamilies: [family],
      fontStyle: {
        weight: toSkiaFontWeight(fontWeight),
        ...(fontStyle === 'italic' ? { slant: 1 } : {}),
      },
    };

    if (letterSpacing != null) {
      skTextStyle.letterSpacing = letterSpacing;
    }
    if (lineHeight != null) {
      skTextStyle.heightMultiplier = lineHeight / fontSize;
    }

    const builder = Skia.ParagraphBuilder.Make(paragraphStyle);
    builder.pushStyle(skTextStyle);
    builder.addText(content);
    builder.pop();

    const para = builder.build();
    para.layout(width);

    return para;
  }, [
    content,
    textColor,
    fontSize,
    family,
    fontWeight,
    fontStyle,
    textAlign,
    numberOfLines,
    ellipsis,
    width,
    lineHeight,
    letterSpacing,
  ]);

  // Use actual paragraph height for accurate layout
  const actualHeight = height ?? paragraph.getHeight();

  const widgetId = useWidget({
    type: 'Text',
    layout: { x, y, width, height: actualHeight },
  });

  // Register hit test only if there are callbacks
  useHitTest(widgetId, {
    rect: { left: x, top: y, width, height: actualHeight },
    callbacks: { onPress, onLongPress },
    behavior: hitTestBehavior,
  });

  return (
    <Group opacity={opacity}>
      <Paragraph paragraph={paragraph} x={x} y={y} width={width} />
    </Group>
  );
});
