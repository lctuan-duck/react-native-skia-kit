// react-native-skia-kit — Flutter-like UI Kit powered by Skia

// ===== Types =====
export type {
  WidgetProps,
  HitTestBehavior,
  LayoutRect,
  WidgetData,
  GestureCallbacks,
  PanEvent,
  BoxProps,
  BoxStyle,
} from './types/widget.types';

// ===== Style Types =====
export type {
  LayoutStyle,
  SpacingStyle,
  ColorStyle,
  BorderStyle,
  ShadowStyle,
  FlexChildStyle,
  FlexContainerStyle,
  SkiaTextStyle,
  SemanticColor,
} from './types/style.types';

// ===== Utils =====
export * from './utils';

// ===== Components =====
export * from './components';

// ===== Dialog Service (convenience functions) =====
export {
  showDialog,
  showBottomSheet,
  showSnackBar,
} from './core/DialogService';

// ===== Hooks =====
export * from './hooks';

// ===== Router (Phase 9 + 14) =====
export { RouteParser, RouterDelegate, createRouter } from './core/Router';

// ===== Global Context (Phase 12) =====
export {
  useLocalizationStore,
  useLocalization,
  useMediaQuery,
} from './core/GlobalContext';

// ===== Accessibility (Phase 13) =====
export { useAccessibility, AccessibilityOverlay } from './core/Accessibility';

// ===== Stores =====
export * from './stores';

// ===== Type =====
export type { RouteConfig, RouteDefinition } from './core/Router';
export type { Breakpoint, MediaQueryInfo } from './core/GlobalContext';
export type {
  AccessibilityProps,
  AccessibilityNode,
} from './core/Accessibility';
