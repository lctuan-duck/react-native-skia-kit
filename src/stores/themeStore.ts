import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== Types =====

export interface TextStyle {
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  letterSpacing?: number;
  fontFamily?: string;
}

export interface ThemeColors {
  // Core
  primary: string;
  primaryVariant: string;
  onPrimary: string;
  secondary: string;
  secondaryVariant: string;
  onSecondary: string;
  tertiary: string;
  onTertiary: string;

  // Status
  success: string;
  successVariant: string;
  onSuccess: string;
  error: string;
  errorVariant: string;
  onError: string;
  warning: string;
  warningVariant: string;
  onWarning: string;
  info: string;
  infoVariant: string;
  onInfo: string;

  // Surface
  background: string;
  surface: string;
  surfaceVariant: string;
  inverseSurface: string;

  // Text
  textBody: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;
  textLink: string;

  // Border / Divider
  border: string;
  borderFocused: string;
  divider: string;
  outline: string;

  // State
  disabled: string;
  overlay: string;
  shadow: string;
  ripple: string;
}

export interface ThemeTypography {
  fontFamily: string;
  displayLarge: TextStyle;
  displayMedium: TextStyle;
  headlineLarge: TextStyle;
  headlineMedium: TextStyle;
  titleLarge: TextStyle;
  titleMedium: TextStyle;
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  labelLarge: TextStyle;
  labelMedium: TextStyle;
  caption: TextStyle;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeElevation {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  elevation: ThemeElevation;
}

// ===== Defaults =====

const lightColors: ThemeColors = {
  primary: '#1a73e8',
  primaryVariant: '#e8f0fe',
  onPrimary: '#ffffff',
  secondary: '#5f6368',
  secondaryVariant: '#e8eaed',
  onSecondary: '#ffffff',
  tertiary: '#7c3aed',
  onTertiary: '#ffffff',

  success: '#16a34a',
  successVariant: '#dcfce7',
  onSuccess: '#ffffff',
  error: '#dc2626',
  errorVariant: '#fee2e2',
  onError: '#ffffff',
  warning: '#d97706',
  warningVariant: '#fef3c7',
  onWarning: '#ffffff',
  info: '#0891b2',
  infoVariant: '#cffafe',
  onInfo: '#ffffff',

  background: '#ffffff',
  surface: '#ffffff',
  surfaceVariant: '#f3f4f6',
  inverseSurface: '#1f2937',

  textBody: '#111827',
  textSecondary: '#6b7280',
  textDisabled: '#d1d5db',
  textInverse: '#f9fafb',
  textLink: '#1a73e8',

  border: '#d1d5db',
  borderFocused: '#1a73e8',
  divider: '#e5e7eb',
  outline: '#9ca3af',

  disabled: '#f3f4f6',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(0,0,0,0.15)',
  ripple: 'rgba(0,0,0,0.12)',
};

const darkColors: ThemeColors = {
  primary: '#8ab4f8',
  primaryVariant: '#1e3a5f',
  onPrimary: '#1e1e1e',
  secondary: '#9aa0a6',
  secondaryVariant: '#3c4043',
  onSecondary: '#1e1e1e',
  tertiary: '#a78bfa',
  onTertiary: '#1e1e1e',

  success: '#4ade80',
  successVariant: '#14532d',
  onSuccess: '#1e1e1e',
  error: '#f87171',
  errorVariant: '#7f1d1d',
  onError: '#1e1e1e',
  warning: '#fbbf24',
  warningVariant: '#78350f',
  onWarning: '#1e1e1e',
  info: '#22d3ee',
  infoVariant: '#164e63',
  onInfo: '#1e1e1e',

  background: '#121212',
  surface: '#1e1e1e',
  surfaceVariant: '#2d2d2d',
  inverseSurface: '#e5e7eb',

  textBody: '#e5e7eb',
  textSecondary: '#9ca3af',
  textDisabled: '#4b5563',
  textInverse: '#1f2937',
  textLink: '#8ab4f8',

  border: '#4b5563',
  borderFocused: '#8ab4f8',
  divider: '#374151',
  outline: '#6b7280',

  disabled: '#374151',
  overlay: 'rgba(0,0,0,0.7)',
  shadow: 'rgba(0,0,0,0.4)',
  ripple: 'rgba(255,255,255,0.12)',
};

const defaultTypography: ThemeTypography = {
  fontFamily: 'System',
  displayLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0.15,
  },
  titleLarge: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 11,
    fontWeight: 'normal',
    lineHeight: 14,
    letterSpacing: 0.4,
  },
};

const defaultSpacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const defaultBorderRadius: ThemeBorderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

const defaultElevation: ThemeElevation = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 16,
};

// ===== Store =====

interface ThemeStoreState {
  themeMap: Map<string, ThemeConfig>;
  activeTheme: string;

  registerTheme: (themeId: string, config: ThemeConfig) => void;
  setActiveTheme: (themeId: string) => void;
  getConfig: () => ThemeConfig;
  getColors: () => ThemeColors;
}

export const useThemeStore = create<ThemeStoreState>()(
  immer((set, get) => ({
    themeMap: new Map<string, ThemeConfig>([
      [
        'light',
        {
          mode: 'light' as ThemeMode,
          colors: lightColors,
          typography: defaultTypography,
          spacing: defaultSpacing,
          borderRadius: defaultBorderRadius,
          elevation: defaultElevation,
        },
      ],
      [
        'dark',
        {
          mode: 'dark' as ThemeMode,
          colors: darkColors,
          typography: defaultTypography,
          spacing: defaultSpacing,
          borderRadius: defaultBorderRadius,
          elevation: defaultElevation,
        },
      ],
    ]),
    activeTheme: 'light',

    registerTheme: (themeId, config) =>
      set((state) => {
        state.themeMap.set(themeId, config);
      }),

    setActiveTheme: (themeId) =>
      set((state) => {
        if (state.themeMap.has(themeId)) {
          state.activeTheme = themeId;
        }
      }),

    getConfig: () => {
      const state = get();
      return (
        state.themeMap.get(state.activeTheme) ??
        (state.themeMap.get('light') as ThemeConfig)
      );
    },

    getColors: () => {
      return get().getConfig().colors;
    },
  }))
);

// ===== Persistence (opt-in) =====

const STORAGE_KEY = 'skia-kit-theme';
const BUILT_IN_THEMES = new Set(['light', 'dark']);

interface PersistedThemeData {
  activeTheme: string;
  customThemes: Array<[string, ThemeConfig]>;
}

/**
 * Enable theme persistence — lưu activeTheme + custom themes qua AsyncStorage.
 *
 * Gọi 1 lần duy nhất khi app khởi tạo. Không gọi = không persist.
 *
 * ```tsx
 * import { enableThemePersistence } from 'react-native-skia-kit';
 *
 * enableThemePersistence(); // gọi 1 lần
 *
 * export default function App() {
 *   return <CanvasRoot>...</CanvasRoot>;
 * }
 * ```
 */
export function enableThemePersistence(): void {
  // 1. Restore saved state
  AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
    if (!raw) return;

    try {
      const data: PersistedThemeData = JSON.parse(raw);
      const store = useThemeStore.getState();

      // Restore custom themes
      for (const [key, config] of data.customThemes ?? []) {
        store.registerTheme(key, config);
      }

      // Restore active theme
      if (data.activeTheme) {
        store.setActiveTheme(data.activeTheme);
      }
    } catch {
      // Invalid data — ignore
    }
  });

  // 2. Subscribe to changes → auto save
  useThemeStore.subscribe((state) => {
    const data: PersistedThemeData = {
      activeTheme: state.activeTheme,
      customThemes: [...state.themeMap.entries()].filter(
        ([key]) => !BUILT_IN_THEMES.has(key)
      ),
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
      // Silent fail — storage not available
    });
  });
}
