import type * as React from 'react';
import type {
  LayoutStyle,
  SpacingStyle,
  ColorStyle,
  BorderStyle,
  ShadowStyle,
  FlexChildStyle,
  FlexContainerStyle,
} from './style.types';

/**
 * Base types cho tất cả widgets trong react-native-skia-kit.
 */

export interface HitSlop {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export interface WidgetProps {
  /** Optional manual ID for the widget */
  id?: string;
  /** Top-left X position (injected by parent flex layout) */
  x?: number;
  /** Top-left Y position (injected by parent flex layout) */
  y?: number;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Extra touch area around the widget */
  hitSlop?: number | HitSlop;
}

/**
 * Hit test behavior — xác định cách widget phản hồi touch events.
 */
export type HitTestBehavior =
  | 'opaque'        // Chặn events
  | 'translucent'   // Nhận và pass qua
  | 'deferToChild'; // Chỉ nhận nếu child nhận

/**
 * Layout rectangle — kết quả tính toán Yoga. Bao gồm cả position và dimensions.
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
  /**
   * Called when a tap gesture completes.
   * localX, localY are coordinates relative to the widget's bounding box.
   */
  onPress?: (localX?: number, localY?: number) => void;
  onPressIn?: (localX?: number, localY?: number) => void;
  onPressOut?: (localX?: number, localY?: number) => void;
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
  localX: number;
  localY: number;
  state: number;
}

// ─── Box Style ───────────────────────────────────────────────────────────────

/**
 * BoxStyle — tất cả CSS-like style props mà Box (và các container) chấp nhận.
 * Reconciler đọc từ props.style và chuyển sang:
 *   - NativeYogaStyle  → LayoutSubsystem (Yoga)
 *   - NativeBoxProps   → RenderSubsystem (BoxNode visual props)
 */
export type BoxStyle = LayoutStyle &
  SpacingStyle &
  ColorStyle &
  BorderStyle &
  ShadowStyle &
  FlexChildStyle &
  FlexContainerStyle;

// ─── Box Props ───────────────────────────────────────────────────────────────

/**
 * BoxProps — Props của `<Box>` component.
 *
 * Reconciler `createInstance('Box', props)` đọc các fields sau:
 *   - `props.id`              → Node ID trong C++ Render Tree (auto-generated nếu không set)
 *   - `props.style`           → `buildNativeStyle()` → NativeYogaStyle + `parseColor()` → NativeBoxProps
 *   - `props.elevation`       → BoxNode.elevation (shadow depth, separate từ Yoga)
 *   - `props.hitTestBehavior` → HitTestSubsystem registration behavior
 *   - `props.on*`             → jsCallbacks Map (gesture callbacks)
 *   - `props.children`        → Reconciler tự xử lý qua `appendInitialChild`
 */
export interface BoxProps extends GestureCallbacks {
  /** Stable widget ID — nếu không set, Reconciler tự generate random ID (`w_xxxxxxxx`) */
  id?: string;

  /** Layout + visual styles */
  style?: BoxStyle;

  /**
   * Absolute X position — shorthand cho `style.left`.
   * Một số components (Scaffold, SnackBar, Dialog) truyền trực tiếp qua prop này.
   * Yoga xử lý positioning, Reconciler map sang `style.left` nếu `style.position === 'absolute'`.
   */
  x?: number;
  /** Absolute Y position — shorthand cho `style.top`. */
  y?: number;

  /**
   * Elevation — tạo drop shadow (Android Material elevation semantics).
   * Map sang `BoxNode.elevation` trong C++.
   * Đặt riêng ngoài `style` vì Yoga không biết về elevation.
   */
  elevation?: number;

  /**
   * Hit test behavior:
   *   - `'opaque'`       → chặn touch events, widget bên dưới không nhận được
   *   - `'translucent'`  → nhận touch và pass qua cho widget bên dưới
   *   - `'deferToChild'` → chỉ nhận nếu child nhận (mặc định khi không có callback)
   *
   * Mặc định: `'opaque'` khi có ít nhất 1 gesture callback, `'deferToChild'` khi không.
   */
  hitTestBehavior?: HitTestBehavior;

  /** Accessibility label */
  accessibilityLabel?: string;

  /**
   * onLayout — callback khi Yoga tính xong layout (best-effort trong v2).
   * Nhận { x, y, width, height } là absolute position trong canvas.
   */
  onLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;

  /** Children — bất kỳ ReactNode nào (Box, Text, Image, ...) */
  children?: React.ReactNode;

  /** Ref forwarded từ React.forwardRef */
  ref?: React.Ref<any>;
}
