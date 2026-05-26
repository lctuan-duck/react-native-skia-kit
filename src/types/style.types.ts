/**
 * Base style group types for react-native-skia-kit.
 *
 * Types are organized into small, composable groups.
 * Components pick only the groups they need (e.g. BoxStyle = LayoutStyle & ColorStyle & ...).
 *
 * NativeYogaStyle in UIEngine.nitro.ts is a separate, internal bridge type
 * used for C++ communication only — components should NOT import it.
 */

import type { SharedValue } from 'react-native-reanimated';
import type { Transforms3d } from '@shopify/react-native-skia';

// === Gradient ===

/**
 * Gradient configuration for `<Box>` style.
 * Use the helper functions `linearGradient()`, `radialGradient()`, `sweepGradient()` to create.
 *
 * @example
 * import { linearGradient } from 'react-native-skia-kit';
 *
 * <Box style={{ gradient: linearGradient(['#FF6B6B', '#FFE66D']) }} />
 */
export interface GradientProps {
  type: 'linear' | 'radial' | 'sweep';
  /** Array of CSS hex colors (e.g. '#FF6B6B'). Minimum 2 colors. */
  colors: string[];
  /**
   * Stop positions corresponding to each color in `colors`, values 0.0–1.0.
   * If omitted, Skia distributes colors evenly.
   */
  positions?: number[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  centerX?: number;
  centerY?: number;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  tileMode?: 'clamp' | 'repeat' | 'mirror';
}

/**
 * All blend modes supported by Skia's SkBlendMode.
 * Equivalent to `mix-blend-mode` in CSS.
 *
 * @example
 * <Box style={{ blendMode: 'multiply' }} />
 */
export type BlendMode =
  | 'srcOver' // Default — draws on top
  | 'multiply' // Multiplies colors — result is darker
  | 'screen' // Inverts, multiplies, inverts — result is lighter
  | 'overlay' // Multiply or Screen depending on base brightness
  | 'darken' // Keeps the darker color
  | 'lighten' // Keeps the lighter color
  | 'colorDodge' // Brightens the base to reflect the source
  | 'colorBurn' // Darkens the base to reflect the source
  | 'hardLight' // Strong overlay
  | 'softLight' // Soft overlay
  | 'difference' // Absolute difference of channel values
  | 'exclusion' // Like difference but lower contrast
  | 'hue' // Hue from source, luminosity + saturation from dest
  | 'saturation' // Saturation from source
  | 'color' // Hue + saturation from source
  | 'luminosity'; // Luminosity from source

/**
 * Preset color filter names — used with the `colorPreset()` helper.
 *
 * @example
 * import { colorPreset } from 'react-native-skia-kit';
 * <Box style={{ colorFilter: colorPreset('grayscale') }} />
 */
export type ColorFilterPreset = 'grayscale' | 'sepia' | 'invert';

/**
 * Style props for gradients, glassmorphism, blend modes and color filters.
 * Merged into `BoxStyle` — use directly in the `style` prop of `<Box>`.
 *
 * @example
 * // All gradient props live inside `style` — no extra imports needed
 * <Box style={{
 *   gradient: linearGradient(['#667eea', '#764ba2'], 135),
 *   backdropBlurRadius: 12,
 *   blendMode: 'multiply',
 *   colorFilter: colorPreset('grayscale'),
 * }} />
 */
export interface GradientStyle {
  /**
   * Gradient shader for the background.
   * Overrides `backgroundColor` when set.
   * Use helpers: `linearGradient()`, `radialGradient()`, `sweepGradient()`.
   */
  gradient?: GradientProps;
  /**
   * Blur radius applied to the content behind the Box (glassmorphism / frosted glass).
   * `backgroundColor` should have alpha < 255 to make the effect visible.
   *
   * @example
   * <Box style={{ backdropBlurRadius: 12, backgroundColor: '#FFFFFF30' }} />
   */
  backdropBlurRadius?: number;
  /**
   * Blend mode applied when this Box composites over content behind it.
   * Equivalent to `mix-blend-mode` in CSS.
   *
   * @example
   * <Box style={{ backgroundColor: '#FF6B6B', blendMode: 'multiply' }} />
   */
  blendMode?: BlendMode;
  /**
   * Color filter applied to all content rendered inside the Box.
   * Accepts a preset (from `colorPreset()`) or a custom 4×5 matrix (20 elements).
   *
   * @example
   * // Preset
   * <Box style={{ colorFilter: colorPreset('grayscale') }} />
   * // Custom matrix
   * <Box style={{ colorFilter: [1.2, 0, 0, 0, -0.1,  0, 1, 0, 0, 0,  0, 0, 0.8, 0, 0.05,  0, 0, 0, 1, 0] }} />
   */
  colorFilter?: number[]; // 4x5 color matrix (20 elements)
}
// === Layout (dimensions & overflow) ===

export interface LayoutStyle {
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  aspectRatio?: number;
  display?: 'flex' | 'none';
  overflow?: 'visible' | 'hidden' | 'scroll';
  direction?: 'inherit' | 'ltr' | 'rtl';
}

// === Spacing (padding & margin — supports shorthand or per-edge) ===

export interface SpacingStyle {
  padding?:
    | number
    | string
    | [number | string, number | string, number | string, number | string];
  paddingHorizontal?: number | string;
  paddingVertical?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  margin?:
    | number
    | string
    | [number | string, number | string, number | string, number | string];
  marginHorizontal?: number | string;
  marginVertical?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  marginRight?: number | string;
}

// === Color ===

export interface ColorStyle {
  backgroundColor?: string;
  /** Static number or animated SharedValue */
  opacity?: number | SharedValue<number>;
}

// === Border ===

export interface BorderStyle {
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderColor?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  borderWidth?: number;
  borderTopWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  dashLength?: number;
  dashSpacing?: number;
}

// === Shadow / Elevation ===

export interface ShadowStyle {
  elevation?: number;
  zIndex?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowSpread?: number;
  shadowType?: 'outer' | 'inner';
}

// === Transform (Skia Group transform — static or animated) ===

export interface TransformStyle {
  /** Transform array — static or animated SharedValue.
   *  Supports: scale, rotate, translateX, translateY, skewX, skewY */
  transform?: Transforms3d | SharedValue<Transforms3d>;
  /** Transform origin — defaults to Box center */
  transformOrigin?: {};
}

// === Flex Child (khi widget là con của flex container) ===

export interface FlexChildStyle {
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string | 'auto';
  alignSelf?:
    | 'auto'
    | 'start'
    | 'center'
    | 'end'
    | 'stretch'
    | 'baseline'
    | 'flex-start'
    | 'flex-end';
  position?: 'relative' | 'absolute';
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
}

// === Flex Container (khi widget chứa children cần flex layout) ===

export interface FlexContainerStyle {
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?:
    | 'start'
    | 'center'
    | 'end'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly'
    | 'flex-start'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?:
    | 'start'
    | 'center'
    | 'end'
    | 'stretch'
    | 'baseline'
    | 'flex-start'
    | 'flex-end';
  alignContent?:
    | 'start'
    | 'center'
    | 'end'
    | 'stretch'
    | 'baseline'
    | 'flex-start'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  gap?: number;
  rowGap?: number;
  columnGap?: number;
}

// === Text ===

export interface SkiaTextStyle {
  fontSize?: number;
  fontFamily?: string;
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
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
}

// === Semantic Color (dùng cho shorthand props) ===

export type SemanticColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'neutral';
