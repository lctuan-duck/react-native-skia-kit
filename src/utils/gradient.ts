import type { GradientProps, ColorFilterPreset } from '../types/style.types';
import { parseColor } from './color';

// ─── Internal helpers ──────────────────────────────────────────────────────

/**
 * Converts an angle in degrees to normalized from/to points for a linear gradient.
 * Follows the same convention as CSS `linear-gradient(angle, ...)`.
 *
 * @param angleDeg - Angle in degrees (0 = left→right, 90 = top→bottom)
 * @returns Normalized start/end coordinates (0–1)
 * @internal
 */
function angleToPoints(angleDeg: number): {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
} {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    startX: 0.5 - sin * 0.5,
    startY: 0.5 + cos * 0.5,
    endX: 0.5 + sin * 0.5,
    endY: 0.5 - cos * 0.5,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Creates a **Linear Gradient** configuration for the `style.gradient` prop of `<Box>`.
 *
 * A linear gradient renders colors along a straight line. The direction is controlled
 * by `angle` (same convention as CSS `linear-gradient(angle, ...)`).
 *
 * @param colors - Array of CSS hex colors. E.g. `['#FF6B6B', '#FFE66D']`. Minimum 2 colors.
 * @param angle  - Gradient direction in **degrees**:
 *   - `0`   → left to right *(default)*
 *   - `90`  → top to bottom
 *   - `45`  → diagonal to bottom-right
 *   - `135` → diagonal to bottom-left
 * @param options - Additional options:
 *   - `positions` - Stop positions (0–1), one-to-one with `colors`. If omitted, Skia distributes evenly.
 *   - `tileMode`  - Behavior outside the gradient area: `'clamp'` | `'repeat'` | `'mirror'`. Default: `'clamp'`.
 *
 * @returns `GradientProps` — pass directly to `style.gradient`.
 *
 * @example
 * // Horizontal gradient (default) — only colors required
 * <Box style={{ gradient: linearGradient(['#FF6B6B', '#FFE66D']) }} />
 *
 * @example
 * // Vertical gradient top → bottom
 * <Box style={{ gradient: linearGradient(['#6C63FF', '#3ECFCF'], 90) }} />
 *
 * @example
 * // Diagonal 135° with multiple colors and custom stop positions
 * <Box style={{
 *   gradient: linearGradient(
 *     ['#1a1a2e', '#0f3460', '#533483'],
 *     135,
 *     { positions: [0, 0.5, 1.0] }
 *   )
 * }} />
 */
export function linearGradient(
  colors: string[],
  angle: number = 0,
  options?: {
    positions?: number[];
    tileMode?: GradientProps['tileMode'];
  }
): GradientProps {
  const { startX, startY, endX, endY } = angleToPoints(angle);
  return {
    type: 'linear',
    colors,
    positions: options?.positions,
    tileMode: options?.tileMode ?? 'clamp',
    startX,
    startY,
    endX,
    endY,
  };
}

/**
 * Creates a **Radial Gradient** configuration for the `style.gradient` prop of `<Box>`.
 *
 * A radial gradient renders colors radiating outward from a center point, like light
 * shining from a source. All parameters are optional — defaults to a centered gradient
 * spanning half the box width.
 *
 * @param colors  - Array of CSS hex colors from center outward. E.g. `['#FFFFFF', '#6C63FF']`.
 * @param options - Additional options:
 *   - `center`    - Center point (normalized 0–1). Default: `{ x: 0.5, y: 0.5 }` (box center).
 *   - `radius`    - Radius (normalized 0–1, relative to width). Default: `0.5`.
 *   - `positions` - Stop positions (0–1). If omitted, Skia distributes evenly.
 *   - `tileMode`  - `'clamp'` | `'repeat'` | `'mirror'`. Default: `'clamp'`.
 *
 * @returns `GradientProps` — pass directly to `style.gradient`.
 *
 * @example
 * // Simplest form — only colors required
 * <Box style={{
 *   borderRadius: 100,
 *   gradient: radialGradient(['#FFFFFF', '#6C63FF'])
 * }} />
 *
 * @example
 * // Custom center offset toward top-left, wider radius
 * <Box style={{
 *   gradient: radialGradient(['#FFFFFF', '#6C63FF'], {
 *     center: { x: 0.3, y: 0.3 },
 *     radius: 0.7,
 *   })
 * }} />
 */
export function radialGradient(
  colors: string[],
  options?: {
    center?: { x: number; y: number };
    radius?: number;
    positions?: number[];
    tileMode?: GradientProps['tileMode'];
  }
): GradientProps {
  return {
    type: 'radial',
    colors,
    positions: options?.positions,
    tileMode: options?.tileMode ?? 'clamp',
    centerX: options?.center?.x ?? 0.5,
    centerY: options?.center?.y ?? 0.5,
    radius: options?.radius ?? 0.5,
  };
}

/**
 * Creates a **Sweep Gradient** configuration for the `style.gradient` prop of `<Box>`.
 *
 * A sweep gradient renders colors rotating around a center point like a clock hand,
 * equivalent to `conic-gradient` in CSS.
 *
 * @param colors  - Array of CSS hex colors in rotation order.
 *   E.g. `['#FF0000', '#00FF00', '#0000FF', '#FF0000']`.
 *   Repeat the first color at the end for a seamless full-circle sweep.
 * @param options - Additional options:
 *   - `center`     - Center point (normalized 0–1). Default: `{ x: 0.5, y: 0.5 }`.
 *   - `startAngle` - Start angle in degrees. Default: `0`.
 *   - `endAngle`   - End angle in degrees. Default: `360`.
 *   - `positions`  - Stop positions (0–1). If omitted, Skia distributes evenly.
 *
 * @returns `GradientProps` — pass directly to `style.gradient`.
 *
 * @example
 * // Full 360° sweep — only colors required
 * <Box style={{
 *   borderRadius: 100,
 *   gradient: sweepGradient(['#FF6B6B', '#FFE66D', '#6C63FF', '#FF6B6B'])
 * }} />
 *
 * @example
 * // Half-circle sweep (0° → 180°) with offset center
 * <Box style={{
 *   gradient: sweepGradient(['#FF6B6B', '#6C63FF'], {
 *     center: { x: 0.5, y: 0.5 },
 *     startAngle: 0,
 *     endAngle: 180,
 *   })
 * }} />
 */
export function sweepGradient(
  colors: string[],
  options?: {
    center?: { x: number; y: number };
    startAngle?: number;
    endAngle?: number;
    positions?: number[];
  }
): GradientProps {
  return {
    type: 'sweep',
    colors,
    positions: options?.positions,
    centerX: options?.center?.x ?? 0.5,
    centerY: options?.center?.y ?? 0.5,
    startAngle: options?.startAngle ?? 0,
    endAngle: options?.endAngle ?? 360,
  };
}

// ─── Color Filter Presets ──────────────────────────────────────────────────

/**
 * Returns a color filter matrix (4×5 = 20 elements) for common color effects.
 * The result can be passed directly to `style.colorFilter` on `<Box>`.
 *
 * The color filter is applied to **all content** inside the Box
 * (background, children, text, images, etc.).
 *
 * @param name - Preset name:
 *   - `'grayscale'` — Converts to black and white (full desaturation)
 *   - `'sepia'`     — Warm brown vintage tone
 *   - `'invert'`    — Inverts all colors (negative film effect)
 *
 * @returns A `number[]` array of 20 values representing the 4×5 color matrix.
 *
 * @example
 * // Black and white image
 * <Box style={{ colorFilter: colorPreset('grayscale') }}>
 *   <Image source={{ uri: '...' }} />
 * </Box>
 *
 * @example
 * // Vintage sepia tone
 * <Box style={{ colorFilter: colorPreset('sepia') }}>
 *   <Image source={{ uri: '...' }} />
 * </Box>
 *
 * @example
 * // Inverted colors
 * <Box style={{ colorFilter: colorPreset('invert') }}>
 *   <Image source={{ uri: '...' }} />
 * </Box>
 */
export function colorPreset(name: ColorFilterPreset): number[] {
  switch (name) {
    case 'grayscale':
      // Luminance-based grayscale (ITU-R BT.709)
      return [
        0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126,
        0.7152, 0.0722, 0, 0, 0, 0, 0, 1, 0,
      ];
    case 'sepia':
      return [
        0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534,
        0.131, 0, 0, 0, 0, 0, 1, 0,
      ];
    case 'invert':
      return [-1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0];
    default:
      // Identity matrix — no change
      return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  }
}

// ─── Internal: Convert GradientProps → NativeGradientProps ────────────────

/**
 * Converts JS-friendly `GradientProps` (hex string colors) → `NativeGradientProps` (SkColor uint32).
 * Called by the Reconciler when building NativeBoxProps.
 * @internal
 */
export function toNativeGradient(
  gradient: GradientProps
): import('../nitro/UIEngine.nitro').NativeGradientProps {
  return {
    ...gradient,
    colors: gradient.colors.map(parseColor),
  };
}
