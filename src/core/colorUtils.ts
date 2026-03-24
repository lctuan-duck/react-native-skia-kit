import type { SemanticColor } from './style.types';
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
