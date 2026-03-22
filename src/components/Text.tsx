import * as React from 'react';
import { useMemo } from 'react';
import { Skia, Paragraph, TextAlign, Group } from '@shopify/react-native-skia';
import type { SkParagraphStyle } from '@shopify/react-native-skia';
import type { WidgetProps, HitTestBehavior } from '../core/types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';

export interface TextProps extends WidgetProps {
  /** Text content */
  text?: string;
  /** Font size */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Font weight */
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  /** Font style (normal or italic) */
  fontStyle?: 'normal' | 'italic';
  /** Text color */
  color?: string;
  /** Opacity */
  opacity?: number;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Max number of lines */
  numberOfLines?: number;
  /** Show ellipsis when text overflows */
  ellipsis?: boolean;
  /** Line height */
  lineHeight?: number;
  /** Letter spacing */
  letterSpacing?: number;
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
  width = 300,
  height,
  text,
  fontSize = 14,
  fontFamily,
  fontWeight = 'normal',
  fontStyle = 'normal',
  color,
  opacity = 1,
  textAlign = 'left',
  numberOfLines,
  ellipsis = false,
  lineHeight,
  letterSpacing,
  hitTestBehavior = 'deferToChild',
  onPress,
  onLongPress,
  children,
}: TextProps) {
  const theme = useTheme();
  const textColor = color ?? theme.colors.textBody;
  const content = text ?? (typeof children === 'string' ? children : '') ?? '';
  const family = fontFamily ?? theme.typography.fontFamily;

  const paragraph = useMemo(() => {
    const alignMap: Record<string, TextAlign> = {
      center: TextAlign.Center,
      right: TextAlign.Right,
      left: TextAlign.Left,
    };

    const paragraphStyle: SkParagraphStyle = {
      textAlign: alignMap[textAlign] ?? TextAlign.Left,
      ...(numberOfLines != null && numberOfLines > 0
        ? { maxLines: numberOfLines }
        : {}),
      ...(ellipsis ? { ellipsis: '...' } : {}),
    };

    const textStyle: Record<string, unknown> = {
      color: Skia.Color(textColor),
      fontSize,
      fontFamilies: [family],
      fontStyle: {
        weight: toSkiaFontWeight(fontWeight),
        ...(fontStyle === 'italic' ? { slant: 1 } : {}),
      },
    };

    if (letterSpacing != null) {
      textStyle.letterSpacing = letterSpacing;
    }
    if (lineHeight != null) {
      textStyle.heightMultiplier = lineHeight / fontSize;
    }

    const builder = Skia.ParagraphBuilder.Make(paragraphStyle);
    builder.pushStyle(textStyle);
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
