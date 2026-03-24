/**
 * Base style group types for react-native-skia-kit.
 *
 * Chỉ chứa base types — component-specific types (BoxStyle, ButtonStyle…)
 * được define trực tiếp trong file component tương ứng.
 */

// === Layout ===

export interface LayoutStyle {
  width?: number;
  height?: number;
  overflow?: 'visible' | 'hidden';
}

// === Spacing ===

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
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  position?: 'relative' | 'absolute';
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

// === Flex Container ===

export interface FlexContainerStyle {
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap';
  justifyContent?:
    | 'start'
    | 'center'
    | 'end'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
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
