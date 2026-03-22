import { Skia } from '@shopify/react-native-skia';

// ===== Types =====

export interface MeasureTextOptions {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
  maxWidth?: number;
}

export interface MeasureTextResult {
  width: number;
  height: number;
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

  const paragraphStyle: Record<string, unknown> = {};
  // Only set maxLines if needed — avoid passing undefined to Skia
  // (Skia crashes on: "Value is undefined, expected a number")

  const builder = Skia.ParagraphBuilder.Make(paragraphStyle);
  builder.pushStyle({
    color: Skia.Color('black'),
    fontSize,
    fontFamilies: [fontFamily],
    fontStyle: { weight: fontWeight === 'bold' ? 700 : 400 },
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
