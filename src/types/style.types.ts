/**
 * Base style group types for react-native-skia-kit.
 *
 * Types are organized into small, composable groups.
 * Components pick only the groups they need (e.g. BoxStyle = LayoutStyle & ColorStyle & ...).
 *
 * NativeYogaStyle in UIEngine.nitro.ts is a separate, internal bridge type
 * used for C++ communication only — components should NOT import it.
 */

// === Layout (dimensions & overflow) ===

export interface LayoutStyle {
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  display?: 'flex' | 'none';
  overflow?: 'visible' | 'hidden' | 'scroll';
  direction?: 'inherit' | 'ltr' | 'rtl';
}

// === Spacing (padding & margin — supports shorthand or per-edge) ===

export interface SpacingStyle {
  padding?: number | [number, number, number, number];
  margin?: number | [number, number, number, number];
}

// === Color ===

export interface ColorStyle {
  backgroundColor?: string;
  opacity?: number;
}

// === Border ===

export interface BorderStyle {
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
}

// === Shadow / Elevation ===

export interface ShadowStyle {
  elevation?: number;
  zIndex?: number;
}

// === Flex Child (khi widget là con của flex container) ===

export interface FlexChildStyle {
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | 'auto';
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
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
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
  gap?: number;
  rowGap?: number;
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
