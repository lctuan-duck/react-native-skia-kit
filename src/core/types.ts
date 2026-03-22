/**
 * Base props cho tất cả widgets trong react-native-skia-kit.
 */
export interface WidgetProps {
  /** Top-left X position */
  x?: number;
  /** Top-left Y position */
  y?: number;
  /** Widget width */
  width?: number;
  /** Widget height */
  height?: number;
  /** Accessibility label */
  accessibilityLabel?: string;

  // ===== Flex layout participation props =====
  // These are read by useYogaLayout when this widget is a child of a flex container.

  /** Flex grow factor (like CSS flex: N) */
  flex?: number;
  /** Flex grow factor (alias) */
  flexGrow?: number;
  /** Override parent's alignItems for this child */
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';
  /** Positioning mode: 'absolute' removes from flow, 'relative' is default */
  position?: 'relative' | 'absolute';
  /** Offset from top (only with position='absolute') */
  top?: number;
  /** Offset from left (only with position='absolute') */
  left?: number;
  /** Offset from right (only with position='absolute') */
  right?: number;
  /** Offset from bottom (only with position='absolute') */
  bottom?: number;
}

/**
 * Hit test behavior — xác định cách widget phản hồi touch events.
 */
export type HitTestBehavior =
  | 'opaque' // Chặn events
  | 'translucent' // Nhận và pass qua
  | 'deferToChild'; // Chỉ nhận nếu child nhận

/**
 * Layout rectangle.
 */
export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Widget data stored in widgetStore.
 */
export interface WidgetData {
  id: string;
  type: string;
  layout: LayoutRect;
  props: Record<string, unknown>;
  state: Record<string, unknown>;
  children: string[];
  parentId?: string;
}

/**
 * Gesture callbacks.
 */
export interface GestureCallbacks {
  onPress?: () => void;
  onLongPress?: () => void;
  onPanStart?: (e: PanEvent) => void;
  onPanUpdate?: (e: PanEvent) => void;
  onPanEnd?: (e: PanEvent) => void;
}

/**
 * Pan gesture event data.
 */
export interface PanEvent {
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
  absoluteX: number;
  absoluteY: number;
}
