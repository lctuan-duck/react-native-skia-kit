// react-native-skia-kit — Flutter-like UI Kit powered by Skia

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

// ===== Layout Components =====
export { Box } from './components/Box';
export { Row } from './components/Row';
export { Column } from './components/Column';
export { Stack, Positioned } from './components/Stack';
export { Expanded, Flexible } from './components/Expanded';
export { Center, Align } from './components/Center';
export { Wrap } from './components/Wrap';
export { Spacer } from './components/Spacer';

// ===== Text =====
export { Text } from './components/Text';

// ===== Display Components =====
export { Icon, getIconNames } from './components/Icon';
export { Image } from './components/Image';
export { Divider } from './components/Divider';
export { Card } from './components/Card';
export { Avatar } from './components/Avatar';
export { Badge } from './components/Badge';
export { Chip } from './components/Chip';
export { Tooltip } from './components/Tooltip';
export { ListTile } from './components/ListTile';
export { ExpansionTile } from './components/ExpansionTile';

// ===== Control Components =====
export { Button } from './components/Button';
export { Checkbox } from './components/Checkbox';
export { Radio } from './components/Radio';
export { Switch } from './components/Switch';
export { Slider } from './components/Slider';
export { DropdownButton } from './components/DropdownButton';
export { PopupMenuButton } from './components/PopupMenuButton';

// ===== Input =====
export { Input } from './components/Input';
export { SearchBar } from './components/SearchBar';

// ===== Feedback =====
export { Progress } from './components/Progress';
export { SnackBar } from './components/SnackBar';
export { RefreshIndicator } from './components/RefreshIndicator';

// ===== Navigation & Scaffold =====
export { Nav, Screen } from './components/Nav';
export { AppBar } from './components/AppBar';
export { BottomNavigationBar } from './components/BottomNavigationBar';
export { TabBar } from './components/TabBar';
export { TabBarView } from './components/TabBarView';
export { Scaffold } from './components/Scaffold';
export { SafeArea } from './components/SafeArea';

// ===== Overlay =====
export { Modal, BottomSheet, Drawer, Overlay } from './components/Overlay';

// ===== Scroll & Pages =====
export { ScrollView, GridView, PageView } from './components/ScrollView';

// ===== Gesture & Interaction =====
export {
  GestureDetector,
  Dismissible,
  Draggable,
} from './components/GestureDetector';

// ===== Form & Advanced =====
export { Form, useForm } from './components/Form';
export { Hero, HeroOverlay } from './components/Hero';

// ===== Dialog Service (convenience functions) =====
export {
  showDialog,
  showBottomSheet,
  showSnackBar,
} from './core/DialogService';

// ===== Component Types =====
export type { BoxProps } from './components/Box';
export type { RowProps } from './components/Row';
export type { ColumnProps } from './components/Column';
export type { StackProps, PositionedProps } from './components/Stack';
export type { ExpandedProps, FlexibleProps } from './components/Expanded';
export type {
  CenterProps,
  AlignProps,
  AlignmentValue,
} from './components/Center';
export type { WrapProps } from './components/Wrap';
export type { SpacerProps } from './components/Spacer';
export type { TextProps } from './components/Text';
export type { IconProps } from './components/Icon';
export type { ImageProps } from './components/Image';
export type { DividerProps } from './components/Divider';
export type { CardProps } from './components/Card';
export type { AvatarProps } from './components/Avatar';
export type { BadgeProps } from './components/Badge';
export type { ChipProps, ChipVariant } from './components/Chip';
export type { TooltipProps } from './components/Tooltip';
export type { ListTileProps } from './components/ListTile';
export type { ExpansionTileProps } from './components/ExpansionTile';
export type { ButtonProps, ButtonVariant } from './components/Button';
export type { CheckboxProps } from './components/Checkbox';
export type { RadioProps } from './components/Radio';
export type { SwitchProps } from './components/Switch';
export type { SliderProps } from './components/Slider';
export type {
  DropdownButtonProps,
  DropdownItem,
} from './components/DropdownButton';
export type {
  PopupMenuButtonProps,
  PopupMenuItem,
} from './components/PopupMenuButton';
export type { InputProps, InputVariant } from './components/Input';
export type { SearchBarProps } from './components/SearchBar';
export type { ProgressProps } from './components/Progress';
export type { SnackBarProps } from './components/SnackBar';
export type { RefreshIndicatorProps } from './components/RefreshIndicator';
export type { NavProps, ScreenProps } from './components/Nav';
export type { AppBarProps } from './components/AppBar';
export type {
  BottomNavigationBarProps,
  BottomNavItem,
} from './components/BottomNavigationBar';
export type { TabBarProps, TabBarVariant, TabItem } from './components/TabBar';
export type { ScaffoldProps } from './components/Scaffold';
export type {
  ModalProps,
  BottomSheetProps,
  DrawerProps,
  OverlayProps,
} from './components/Overlay';
export type {
  ScrollViewProps,
  GridViewProps,
  PageViewProps,
} from './components/ScrollView';
export type {
  GestureDetectorProps,
  DismissibleProps,
  DraggableProps,
} from './components/GestureDetector';
export type { FormProps } from './components/Form';
export type { HeroProps } from './components/Hero';

// ===== Hooks =====
export { useTheme } from './hooks/useTheme';
export { useWidget } from './hooks/useWidget';
export { useWidgetId } from './hooks/useWidgetId';
export { useHitTest } from './hooks/useHitTest';
export { useYogaLayout } from './hooks/useYogaLayout';
export { useNav } from './hooks/useNav';
export { useAnimation } from './hooks/useAnimation';
export { useScrollPhysics } from './hooks/useScrollPhysics';
export { useScreenState } from './hooks/useScreenState';

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

// ===== Scroll & List Components =====
export { VirtualizedList } from './components/VirtualizedList';

// ===== Utils =====
export { measureText } from './utils/measureText';

// ===== Stores =====
export { useThemeStore, enableThemePersistence } from './stores/themeStore';
export { useWidgetStore } from './stores/widgetStore';
export { useLayoutStore } from './stores/layoutStore';
export { useEventStore, GestureArenaManager } from './stores/eventStore';
export { useNavStore } from './stores/navStore';
export { useOverlayStore } from './stores/overlayStore';
export { useHeroStore } from './stores/heroStore';
export { useAccessibilityStore } from './stores/accessibilityStore';

// ===== Store Types =====
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

export type { LayoutEntry, LayoutConstraints } from './stores/layoutStore';
export type {
  HitEntry,
  HitRect,
  GestureDisposition,
} from './stores/eventStore';
export type { NavObject } from './stores/navStore';
export type { OverlayEntry } from './stores/overlayStore';
export type { HeroData } from './stores/heroStore';
export type { AccessibilityInfo } from './stores/accessibilityStore';

export type { YogaFlexProps, ComputedLayout } from './hooks/useYogaLayout';
export type {
  AnimationConfig,
  AnimationController,
} from './hooks/useAnimation';
export type {
  MeasureTextOptions,
  MeasureTextResult,
} from './utils/measureText';
export type { TransitionType } from './components/Nav';
export type { RouteConfig, RouteDefinition } from './core/Router';
export type { Breakpoint, MediaQueryInfo } from './core/GlobalContext';
export type {
  AccessibilityProps,
  AccessibilityNode,
} from './core/Accessibility';
export type { VirtualizedListProps } from './components/VirtualizedList';
