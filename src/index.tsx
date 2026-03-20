// react-native-skia-kit — Flutter-like UI Kit powered by Skia
// Phase 2: Core Foundation

// ===== Core =====
export { CanvasRoot } from './core/CanvasRoot';

// ===== Types =====
export type {
  WidgetProps,
  HitTestBehavior,
  LayoutRect,
  WidgetData,
  GestureCallbacks,
  PanEvent,
} from './core/types';

// ===== Components =====
export { Box } from './components/Box';
export { Text } from './components/Text';

export type { BoxProps } from './components/Box';
export type { TextProps } from './components/Text';

// ===== Hooks =====
export { useTheme } from './hooks/useTheme';
export { useWidget } from './hooks/useWidget';

// ===== Stores =====
export { useThemeStore, enableThemePersistence } from './stores/themeStore';
export { useWidgetStore } from './stores/widgetStore';

export type {
  ThemeColors,
  ThemeConfig,
  ThemeTypography,
  ThemeSpacing,
  ThemeBorderRadius,
  ThemeElevation,
  ThemeMode,
  TextStyle,
} from './stores/themeStore';
