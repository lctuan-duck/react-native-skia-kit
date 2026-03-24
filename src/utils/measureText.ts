import { Skia } from '@shopify/react-native-skia';
import type { SkParagraphStyle } from '@shopify/react-native-skia';
import type { SkiaTextStyle } from '../core/style.types';

// ===== Types =====

export interface MeasureTextOptions
  extends Pick<SkiaTextStyle, 'fontSize' | 'fontWeight' | 'fontFamily'> {
  maxWidth?: number;
}

export interface MeasureTextResult {
  width: number;
  height: number;
}

// Map fontWeight string to Skia numeric weight (shared with Text component)
function toSkiaFontWeight(weight: SkiaTextStyle['fontWeight']): number {
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
  return map[weight ?? 'normal'] ?? 400;
}

/**
 * Measure text dimensions using Skia Paragraph API.
 * Used by the layout engine to calculate text bounds before rendering.
 *
 * IMPORTANT: paragraphStyle must not contain `undefined` values —
 * Skia native crashes on undefined where it expects a number.
 */
export function measureText(
  text: string,
  options: MeasureTextOptions = {}
): MeasureTextResult {
  const {
    fontSize = 14,
    fontWeight = 'normal',
    fontFamily = 'System',
    maxWidth = 10000,
  } = options;

  const paragraphStyle: SkParagraphStyle = {};

  const builder = Skia.ParagraphBuilder.Make(paragraphStyle);
  builder.pushStyle({
    color: Skia.Color('black'),
    fontSize,
    fontFamilies: [fontFamily],
    fontStyle: { weight: toSkiaFontWeight(fontWeight) },
  });
  builder.addText(text);
  builder.pop();

  const para = builder.build();
  para.layout(maxWidth);

  return {
    width: para.getMaxIntrinsicWidth(),
    height: para.getHeight(),
  };
}
