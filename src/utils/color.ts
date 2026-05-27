import type { SemanticColor } from '../types/style.types';
import type { ThemeColors } from '../stores/themeStore';

/**
 * Resolve a SemanticColor to its hex value from theme colors.
 * Used by UI components that accept `color: SemanticColor` shorthand.
 */
export function resolveSemanticColor(
  color: SemanticColor,
  colors: ThemeColors
): string {
  const map: Record<SemanticColor, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    info: colors.info,
    warning: colors.warning,
    error: colors.error,
    neutral: colors.textSecondary,
  };
  return map[color] ?? colors.primary;
}

/**
 * Resolve a SemanticColor to its "on" color (contrast text) from theme colors.
 */
export function resolveOnColor(
  color: SemanticColor,
  colors: ThemeColors
): string {
  const map: Record<SemanticColor, string> = {
    primary: colors.onPrimary,
    secondary: colors.onSecondary,
    success: colors.onSuccess,
    info: colors.onInfo,
    warning: colors.onWarning,
    error: colors.onError,
    neutral: colors.textInverse,
  };
  return map[color] ?? colors.onPrimary;
}

/**
 * Apply opacity to a hex color string.
 * Handles both 7-char (#RRGGBB) and 9-char (#RRGGBBAA) inputs.
 */
export function withOpacity(hex: string, opacity: number): string {
  if (!hex || hex.length < 7) return hex;
  // Strip existing alpha if present (#RRGGBBAA → #RRGGBB)
  const base = hex.length >= 9 ? hex.slice(0, 7) : hex;
  return (
    base +
    Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')
  );
}

/**
 * Compute a readable contrast color (black or white) for a given hex.
 */
export function contrastColor(hex: string): string {
  if (!hex || hex.length < 7) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * parseColor — Chuyển CSS color string → SkColor (ARGB packed uint32).
 * Hỗ trợ: #RGB, #RRGGBB, #RRGGBBAA, rgba(), transparent.
 * Luôn trả về number (không trả về undefined) — SkColor 0x00000000 = transparent.
 */
export function parseColor(color?: string | number): number {
  'worklet';
  if (typeof color === 'number') return color;
  if (!color || color === 'transparent') return 0x00000000;
  if (color === 'white') return 0xffffffff;
  if (color === 'black') return 0xff000000;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0]! + hex[0]!, 16);
      const g = parseInt(hex[1]! + hex[1]!, 16);
      const b = parseInt(hex[2]! + hex[2]!, 16);
      return (0xff000000 | (r << 16) | (g << 8) | b) >>> 0;
    }
    if (hex.length === 6) {
      const n = parseInt(hex, 16);
      return (0xff000000 | n) >>> 0;
    }
    if (hex.length === 8) {
      // #RRGGBBAA → AARRGGBB (SkColor is ARGB)
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16);
      return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
    }
  }
  if (color.startsWith('rgb')) {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) {
      const r = parseInt(m[1]!),
        g = parseInt(m[2]!),
        b = parseInt(m[3]!);
      const a = Math.round(parseFloat(m[4] ?? '1') * 255);
      return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
    }
  }
  // Fallback — không parse được → transparent
  return 0x00000000;
}
