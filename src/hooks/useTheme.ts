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
 * Hook to access current theme + theme actions.
 * Equivalent of Flutter's Theme.of(context).
 *
 * Returns theme config (colors, typography, spacing, borderRadius, elevation, mode)
 * plus setTheme/toggleTheme actions.
 */
export function useTheme() {
  const config = useThemeStore((s) => s.getConfig());
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const setActiveTheme = useThemeStore((s) => s.setActiveTheme);

  return {
    mode: config.mode,
    colors: config.colors,
    typography: config.typography,
    spacing: config.spacing,
    borderRadius: config.borderRadius,
    elevation: config.elevation,

    // Actions
    setTheme: (themeId: string) => setActiveTheme(themeId),
    toggleTheme: () =>
      setActiveTheme(activeTheme === 'light' ? 'dark' : 'light'),
  };
}
