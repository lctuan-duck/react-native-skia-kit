import * as React from 'react';
import { useMemo } from 'react';
import { Skia, Paragraph, TextAlign, Group } from '@shopify/react-native-skia';
import type { SkParagraphStyle } from '@shopify/react-native-skia';
import type { WidgetProps, HitTestBehavior } from '../types/widget.types';
import type { SkiaTextStyle, FlexChildStyle } from '../types/style.types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';

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
    'normal': 400,
    'bold': 700,
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

// Large fallback width used for initial intrinsic measurement pass.
// Ensures text doesn't wrap artificially before Yoga provides real width.
const MEASURE_MAX_WIDTH = 9999;

/**
 * Build a Skia Paragraph with given parameters.
 * Extracted to allow re-building with different widths (measure pass vs final pass).
 */
function buildParagraph(
  content: string,
  layoutWidth: number,
  textColor: string,
  fontSize: number,
  family: string,
  fontWeight: string,
  fontStyle: string,
  textAlign: string,
  numberOfLines: number | undefined,
  ellipsis: EllipsisMode,
  letterSpacing: number | undefined,
  lineHeight: number | undefined,
) {
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
  para.layout(layoutWidth);

  return para;
}

/**
 * Text — renders text on Skia canvas using Paragraph API.
 * Equivalent to Flutter Text widget.
 *
 * Layout strategy (two-pass):
 * 1. MEASURE PASS: Build paragraph with large max width to get intrinsic size.
 *    Register intrinsic size with Yoga so the layout engine knows the text's natural size.
 * 2. FINAL PASS: After Yoga computes the actual available width, rebuild paragraph
 *    with that width so text wraps correctly within its container.
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
    width: styleWidth,
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

  // === PASS 1: Measure intrinsic size ===
  // Build with large width to measure how wide the text naturally wants to be.
  // This gives us getMaxIntrinsicWidth() and getHeight() for Yoga registration.
  const measureParagraph = useMemo(() => {
    const measureWidth = typeof styleWidth === 'number' ? styleWidth : MEASURE_MAX_WIDTH;
    return buildParagraph(
      content, measureWidth, textColor, fontSize, family,
      fontWeight, fontStyle, textAlign, numberOfLines, ellipsis,
      letterSpacing, lineHeight,
    );
  }, [
    content, textColor, fontSize, family, fontWeight, fontStyle,
    textAlign, numberOfLines, ellipsis, styleWidth, lineHeight, letterSpacing,
  ]);

  const intrinsicWidth = measureParagraph.getMaxIntrinsicWidth();
  const intrinsicHeight = measureParagraph.getHeight();
  const actualHeight = height ?? intrinsicHeight;

  const widgetId = useWidget({
    type: 'Text',
    layout: { x, y, width: intrinsicWidth, height: actualHeight },
  });

  // Register with Yoga using intrinsic dimensions
  const layoutResult = useNativeYogaLayout(
    widgetId,
    {
      ...style,
      // Provide intrinsic content size to Yoga
      width: styleWidth ?? intrinsicWidth,
      height: actualHeight,
    },
    children
  );

  const finalX = layoutResult?.x ?? x;
  const finalY = layoutResult?.y ?? y;
  const finalWidth = layoutResult?.width ?? (typeof styleWidth === 'number' ? styleWidth : intrinsicWidth);



  // === PASS 2: Build final paragraph with Yoga-computed width ===
  // This ensures text wraps correctly within the container width.
  const finalParagraph = useMemo(() => {
    // Use Yoga width if available and different from measure width
    const renderWidth = finalWidth > 0 ? finalWidth : (typeof styleWidth === 'number' ? styleWidth : intrinsicWidth);
    return buildParagraph(
      content, renderWidth, textColor, fontSize, family,
      fontWeight, fontStyle, textAlign, numberOfLines, ellipsis,
      letterSpacing, lineHeight,
    );
  }, [
    content, textColor, fontSize, family, fontWeight, fontStyle,
    textAlign, numberOfLines, ellipsis, finalWidth, styleWidth,
    intrinsicWidth, lineHeight, letterSpacing,
  ]);

  // Center vertically if explicit height given is larger than content
  const pHeight = finalParagraph.getHeight();
  const yOffset =
    height != null && height > pHeight ? (height - pHeight) / 2 : 0;

  // Register hit test only if there are callbacks
  useHitTest(widgetId, {
    rect: { left: finalX, top: finalY, width: finalWidth, height: actualHeight },
    callbacks: { onPress, onLongPress },
    behavior: hitTestBehavior,
  });

  return (
    <Group opacity={opacity} transform={[{ translateX: finalX }, { translateY: finalY + yOffset }]}>
      <Paragraph paragraph={finalParagraph} width={Math.ceil(finalWidth) + 1} x={0} y={0} />
    </Group>
  );
});

(Text as any).skiaWidgetType = 'Text';


