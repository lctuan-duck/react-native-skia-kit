import { useThemeStore } from '../stores/themeStore';

import type {
  ThemeConfig,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeBorderRadius,
  ThemeElevation,
} from '../stores/themeStore';

export type {
  ThemeConfig,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeBorderRadius,
  ThemeElevation,
};

/**
 * Hook to access current theme — equivalent of Flutter's Theme.of(context).
 *
 * Usage:
 * ```ts
 * const theme = useTheme();
 * const bg = theme.colors.primary;
 * const fontSize = theme.typography.bodyLarge.fontSize;
 * ```
 */
export function useTheme(): ThemeConfig {
  return useThemeStore((s) => s.getConfig());
}
