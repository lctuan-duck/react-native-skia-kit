import React, { useMemo } from 'react';
import { Skia, Paragraph } from '@shopify/react-native-skia';
import type { WidgetProps } from '../core/types';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';

export interface TextProps extends WidgetProps {
  /** Text content */
  text?: string;
  /** Font size */
  fontSize?: number;
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
  /** Text color */
  color?: string;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Max lines (0 = unlimited) */
  maxLines?: number;
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

function toSkiaTextAlign(align: string): number {
  switch (align) {
    case 'center':
      return 2; // TextAlign.Center
    case 'right':
      return 1; // TextAlign.Right
    default:
      return 0; // TextAlign.Left
  }
}

/**
 * Text — renders text on Skia canvas using Paragraph API.
 * Tương đương Flutter Text widget.
 */
export const Text = React.memo(function SkiaText({
  x = 0,
  y = 0,
  width = 300,
  height,
  text,
  fontSize = 14,
  fontWeight = 'normal',
  color,
  textAlign = 'left',
  maxLines = 0,
  children,
}: TextProps) {
  const theme = useTheme();
  const textColor = color ?? theme.colors.textBody;
  const content = text ?? children ?? '';

  useWidget({
    type: 'Text',
    layout: { x, y, width, height: height ?? fontSize * 1.5 },
  });

  const paragraph = useMemo(() => {
    const paragraphStyle = {
      textAlign: toSkiaTextAlign(textAlign),
      maxLines: maxLines > 0 ? maxLines : undefined,
    };

    const textStyle = {
      color: Skia.Color(textColor),
      fontSize,
      fontFamilies: [theme.typography.fontFamily],
      fontStyle: {
        weight: toSkiaFontWeight(fontWeight),
      },
    };

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
    fontWeight,
    textAlign,
    maxLines,
    width,
    theme.typography.fontFamily,
  ]);

  return <Paragraph paragraph={paragraph} x={x} y={y} width={width} />;
});
