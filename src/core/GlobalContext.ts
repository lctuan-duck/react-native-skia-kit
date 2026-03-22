/**
 * Localization & MediaQuery — Global context providers.
 * Phase 12: Global Context & Provider.
 *
 * - LocalizationProvider: Provides translations via zustand store
 * - MediaQueryProvider: Provides screen dimensions & breakpoints
 * - useLocalization: Hook to access translations
 * - useMediaQuery: Hook to access screen info & breakpoints
 */

import { create } from 'zustand';
import { useWindowDimensions } from 'react-native';

// ===== Localization =====

export type Translations = Record<string, Record<string, string>>;

interface LocalizationState {
  locale: string;
  translations: Translations;
  fallbackLocale: string;

  setLocale: (locale: string) => void;
  setTranslations: (translations: Translations) => void;
  t: (key: string) => string;
}

export const useLocalizationStore = create<LocalizationState>((set, get) => ({
  locale: 'vi',
  translations: {},
  fallbackLocale: 'en',

  setLocale: (locale) => set({ locale }),

  setTranslations: (translations) => set({ translations }),

  t: (key) => {
    const { locale, translations, fallbackLocale } = get();
    // Try current locale
    const localeTranslations = translations[locale];
    if (localeTranslations && localeTranslations[key]) {
      return localeTranslations[key];
    }
    // Try fallback
    const fallbackTranslations = translations[fallbackLocale];
    if (fallbackTranslations && fallbackTranslations[key]) {
      return fallbackTranslations[key];
    }
    // Return key as-is
    return key;
  },
}));

/**
 * Hook to use localization.
 *
 * @example
 * const { t, locale, setLocale } = useLocalization();
 * <Text text={t('welcome_message')} />
 */
export function useLocalization() {
  const locale = useLocalizationStore((s) => s.locale);
  const setLocale = useLocalizationStore((s) => s.setLocale);
  const setTranslations = useLocalizationStore((s) => s.setTranslations);
  const t = useLocalizationStore((s) => s.t);

  return { locale, setLocale, setTranslations, t };
}

// ===== MediaQuery =====

export type Breakpoint = 'compact' | 'medium' | 'expanded' | 'large';

export interface MediaQueryInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isPortrait: boolean;
  isLandscape: boolean;
  isCompact: boolean;
  isMedium: boolean;
  isExpanded: boolean;
}

function getBreakpoint(width: number): Breakpoint {
  if (width < 600) return 'compact'; // Phone portrait
  if (width < 840) return 'medium'; // Tablet portrait / phone landscape
  if (width < 1200) return 'expanded'; // Tablet landscape
  return 'large'; // Desktop
}

/**
 * Hook to get responsive screen info, following Material 3 breakpoints.
 *
 * @example
 * const { breakpoint, isCompact, width } = useMediaQuery();
 * const columns = isCompact ? 2 : 4;
 */
export function useMediaQuery(): MediaQueryInfo {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);

  return {
    width,
    height,
    breakpoint,
    isPortrait: height >= width,
    isLandscape: width > height,
    isCompact: breakpoint === 'compact',
    isMedium: breakpoint === 'medium',
    isExpanded: breakpoint === 'expanded' || breakpoint === 'large',
  };
}
