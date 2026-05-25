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
