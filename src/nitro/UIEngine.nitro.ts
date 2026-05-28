import { type HybridObject } from 'react-native-nitro-modules';

export interface NativeLayoutRect {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export interface NativeHitResult {
  id: string;
  localX: number;
  localY: number;
}

/**
 * Yoga style object truyền từ JS → C++.
 * Mỗi field là optional — C++ chỉ set property nào có giá trị (has_value).
 */
export interface NativeYogaStyle {
  // === Container ===
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  flexWrap?: string;
  gap?: number;
  rowGap?: number;
  columnGap?: number;

  // === Child ===
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  alignSelf?: string;

  // === Dimensions & Constraints ===
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  aspectRatio?: number;

  // === Layout Rules ===
  display?: string; // 'flex' | 'none'
  overflow?: string; // 'visible' | 'hidden' | 'scroll'
  direction?: string; // 'inherit' | 'ltr' | 'rtl'

  // === Padding ===
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;

  // === Margin ===
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;

  // === Position ===
  position?: string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
}

// ── Render Tree props ──────────────────────────────────────────────────────

/**
 * Gradient configuration for BoxNode.
 *
 * Coordinates `startX/Y`, `endX/Y`, `centerX/Y` use a normalized system (0–1).
 * C++ multiplies them by the Box width/height when rendering.
 *
 * @example
 * // Horizontal linear (startX=0 → endX=1, Y fixed at 0.5)
 * { type: 'linear', colors: [0xFFFF6B6B, 0xFFFFE66D], startX: 0, startY: 0.5, endX: 1, endY: 0.5 }
 */
export interface NativeGradientProps {
  /** Gradient type: 'linear' | 'radial' | 'sweep' */
  type: string;
  /** Array of SkColor values (ARGB packed uint32). Minimum 2 colors. */
  colors: number[];
  /**
   * Stop positions corresponding to each color in `colors`, values 0.0–1.0.
   * If omitted, Skia distributes stops evenly.
   */
  positions?: number[];
  /** X coordinate of start point (normalized 0–1). Used for `linear`. Default: 0 */
  startX?: number;
  /** Y coordinate of start point (normalized 0–1). Used for `linear`. Default: 0.5 */
  startY?: number;
  /** X coordinate of end point (normalized 0–1). Used for `linear`. Default: 1 */
  endX?: number;
  /** Y coordinate of end point (normalized 0–1). Used for `linear`. Default: 0.5 */
  endY?: number;
  /** X coordinate of center (normalized 0–1). Used for `radial` and `sweep`. Default: 0.5 */
  centerX?: number;
  /** Y coordinate of center (normalized 0–1). Used for `radial` and `sweep`. Default: 0.5 */
  centerY?: number;
  /** Radius (normalized 0–1, relative to width). Used for `radial`. Default: 0.5 */
  radius?: number;
  /** Start angle in degrees. Used for `sweep`. Default: 0 */
  startAngle?: number;
  /** End angle in degrees. Used for `sweep`. Default: 360 */
  endAngle?: number;
  /** Tile mode when gradient extends beyond its bounds. Default: 'clamp' */
  tileMode?: string;
}

/**
 * NativeAnimatedStyle — animated style props passed from JS → C++ RenderNode.
 * Colors use SkColor format (ARGB packed uint32, e.g. 0xFF2196F3).
 */
export interface NativeAnimatedStyle {
  // Dimensions & Layout Bounds
  width?: number | string;
  height?: number | string;
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;

  // Transform 2D/3D
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  rotateZ?: number;
  rotateX?: number;
  rotateY?: number;
  skewX?: number;
  skewY?: number;
  perspective?: number;
  transformOriginX?: number;
  transformOriginY?: number;

  // Visual & Layer
  opacity?: number;
  backgroundColor?: number;
  zIndex?: number;
  pointerEvents?: string; // 'auto' | 'none' | 'box-none' | 'box-only'

  // Border radius
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomRightRadius?: number;
  borderBottomLeftRadius?: number;

  // Border
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: number;
  borderTopColor?: number;
  borderRightColor?: number;
  borderBottomColor?: number;
  borderLeftColor?: number;
  borderStyle?: string; // 'solid' | 'dashed' | 'dotted'
  dashLength?: number;
  dashSpacing?: number;

  // Shadow
  shadowColor?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowSpread?: number;
  shadowType?: string; // 'outer' | 'inner'

  // Phase 3: Shaders & Filters
  /** Gradient shader for the background. Overrides `backgroundColor` when set. */
  gradient?: NativeGradientProps;
  /** Backdrop blur radius (frosted glass / glassmorphism). Unit: logical pixels. */
  backdropBlurRadius?: number;
  /**
   * Blend mode when this BoxNode composites over content behind it.
   * Supports all SkBlendMode values: 'srcOver' | 'multiply' | 'screen' | 'overlay' |
   * 'darken' | 'lighten' | 'colorDodge' | 'colorBurn' | 'hardLight' |
   * 'softLight' | 'difference' | 'exclusion' | 'hue' | 'saturation' |
   * 'color' | 'luminosity'
   */
  blendMode?: string;
  /**
   * Color filter matrix (4×5 = 20 elements).
   * Applied to all content rendered inside the Box.
   * Order: [R-row(5), G-row(5), B-row(5), A-row(5)].
   */
  colorFilter?: number[];
}

export interface NativeBoxProps {
  backgroundColor?: number; // SkColor ARGB

  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomRightRadius?: number;
  borderBottomLeftRadius?: number;

  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;

  borderColor?: number; // SkColor ARGB
  borderTopColor?: number;
  borderRightColor?: number;
  borderBottomColor?: number;
  borderLeftColor?: number;

  borderStyle?: string; // 'solid' | 'dashed' | 'dotted'
  dashLength?: number;
  dashSpacing?: number;

  elevation?: number; // Android shadow / iOS drop shadow

  shadowColor?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowSpread?: number;
  shadowType?: string; // 'outer' | 'inner'

  overflowHidden?: boolean;

  // Phase 3: Shaders & Filters
  /** Gradient shader for the background. Overrides `backgroundColor` when set. */
  gradient?: NativeGradientProps;
  /** Backdrop blur radius (frosted glass / glassmorphism). Unit: logical pixels. */
  backdropBlurRadius?: number;
  /**
   * Blend mode when this BoxNode composites over content behind it.
   * Supports: 'srcOver' | 'multiply' | 'screen' | 'overlay' | 'darken' |
   * 'lighten' | 'colorDodge' | 'colorBurn' | 'hardLight' | 'softLight' |
   * 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity'
   */
  blendMode?: string;
  /**
   * Color filter matrix (4×5 = 20 elements).
   * Applied to all content rendered inside the Box.
   */
  colorFilter?: number[];
}

/**
 * NativeTextProps — Text content + style cho TextNode.
 */
export interface NativeTextProps {
  content: string;
  fontSize?: number;
  color?: number; // SkColor ARGB
  fontFamily?: string;
  fontWeight?: number; // 100 – 900
  textAlign?: string; // 'left' | 'center' | 'right'
  numberOfLines?: number; // 0 = unlimited
}

export interface UIEngine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // ================= HIT TESTING ================= //

  registerWidget(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    zIndex: number,
    behavior: number
  ): void;
  unregisterWidget(id: string): void;
  registerScrollArea(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    horizontal: boolean
  ): void;
  hitTest(x: number, y: number): NativeHitResult[];

  // ================= YOGA LAYOUT ================= //

  /**
   * Cập nhật style Yoga cho node đã tồn tại.
   * Hiện tại chỉ dùng cho ScrollNode (force overflow:hidden).
   */
  updateLayoutNode(id: string, style: NativeYogaStyle): void;
  calculateLayout(rootId: string, width: number, height: number): void;
  getAllLayouts(): Record<string, NativeLayoutRect>;

  // ================= RENDER TREE (v2) ================= //

  /**
   * Validate rằng PlatformContext đã được inject trước khi JS render.
   * PlatformContext thực tế được inject tại platform module init (JNI/iOS) — xem Section 15.
   * Method này chỉ trigger bước khởi tạo còn lại (validate FontCollection sẵn sàng).
   */
  initRenderEngine(): void;

  // Box
  createBoxNode(
    id: string,
    yogaStyle: NativeYogaStyle,
    props: NativeBoxProps
  ): void;
  updateBoxNode(
    id: string,
    yogaStyle: NativeYogaStyle,
    props: NativeBoxProps
  ): void;

  // Text
  createTextNode(
    id: string,
    yogaStyle: NativeYogaStyle,
    props: NativeTextProps
  ): void;
  updateTextNode(
    id: string,
    yogaStyle: NativeYogaStyle,
    props: NativeTextProps
  ): void;

  // Image
  // Note: C++ auto-triggers startImageLoad when uri is non-empty.
  // No need to call startImageLoad separately from JS.
  createImageNode(
    id: string,
    uri: string,
    fit: string,
    borderRadius: number
  ): void;
  updateImageNode(
    id: string,
    uri: string,
    fit: string,
    borderRadius: number
  ): void;
  /**
   * @deprecated C++ auto-triggers load in createImageNode/updateImageNode.
   * Kept for backward compatibility — will be removed in next cleanup.
   */
  // startImageLoad(id: string): void; // ← REMOVED: deprecated, auto-trigger in createImageNode

  // Icon — SVG path string
  createIconNode(
    id: string,
    yogaStyle: NativeYogaStyle,
    pathStr: string,
    color: number,
    isStroke: boolean,
    strokeWidth: number
  ): void;
  updateIconNode(
    id: string,
    yogaStyle: NativeYogaStyle,
    pathStr: string,
    color: number,
    isStroke: boolean,
    strokeWidth: number
  ): void;

  // Scroll
  createScrollNode(
    id: string,
    horizontal: boolean,
    contentPadding: number
  ): void;
  updateScrollNode(
    id: string,
    horizontal: boolean,
    contentPadding: number
  ): void;

  /**
   * createScrollNodeFull — Atomic Scroll node setup.
   * Replaces 4 separate JS calls:
   *   createScrollNode + updateLayoutNode(overflow:hidden) + registerScrollArea + registerWidget
   * → 1 JSI call, C++ handles all 4 operations atomically.
   * Use this for new Scroll node creation.
   */
  createScrollNodeFull(
    id: string,
    yogaStyle: NativeYogaStyle,
    horizontal: boolean,
    contentPadding: number,
    zIndex: number
  ): void;

  // Tree structure
  addRenderChild(parentId: string, childId: string): void;
  insertRenderChildBefore(
    parentId: string,
    childId: string,
    beforeChildId: string
  ): void;
  removeRenderChild(parentId: string, childId: string): void;
  /** Recursive cleanup — xóa node + toàn bộ descendant */
  removeRenderNode(id: string): void;

  // ================= ANIMATION ================= //

  /**
   * updateAnimatedStyles — Cập nhật animated style props trên một RenderNode.
   * Gọi từ Reanimated worklet (qua scheduleOnRN) hoặc trực tiếp từ JS thread.
   * KHÔNG trigger calculateLayout (Yoga) — chỉ set animated overrides trên node.
   * Sau khi gọi, phải trigger skiaKitScrollRedraw() để rebuild SkPicture.
   */
  updateAnimatedStyles(id: string, style: NativeAnimatedStyle): void;

  /**
   * setScrollPosition — Atomic scroll offset update.
   * Replaces 2 separate JS calls per frame:
   *   updateScrollNodeOffset(id, val)  ← Render tree visual offset
   *   updateScrollOffset(id, val)       ← HitTest WidgetRegistry offset
   * → 1 JSI call, C++ updates both atomically.
   * Called per-frame from ScrollView RAF loop @ 60fps.
   * Saving: 1 JNI crossing / frame = 60 JNI crossings/second.
   */
  setScrollPosition(id: string, offset: number): void;

  /** Đánh dấu dirty → rebuild SkPicture ở frame tiếp theo */
  markDirty(rootId: string): void;

  // ── Render Control (C++ Autonomous — thay thế JS-driven requestRedraw) ──

  /**
   * scheduleLayoutAndRender — Trigger C++ autonomous layout + render.
   * Gọi từ resetAfterCommit (JS Thread) thay vì JS requestRedraw().
   * Non-blocking: trả về ngay, C++ tự render trên Main Thread.
   */
  scheduleLayoutAndRender(): void;

  /**
   * beginCommit — Gọi từ reconciler's prepareForCommit.
   * Ngăn tất cả renders trong khi reconciler đang commit partial state.
   * Tránh render intermediate tree → flicker khi chuyển tab.
   */
  beginCommit(): void;

  /**
   * endCommit — Gọi từ reconciler's resetAfterCommit (TRƯỚC scheduleLayoutAndRender).
   * Mở khóa rendering.
   */
  endCommit(): void;

  /**
   * detachNativeView — Cleanup khi CanvasRoot unmount.
   * Gọi từ useLayoutEffect cleanup trong CanvasRoot.
   */
  detachNativeView(): void;

  /**
   * resize — Notify C++ engine khi screen rotate hoặc view bounds thay đổi.
   */
  resize(width: number, height: number): void;

  // ── Canvas Integration (Phase 6E) — đã xóa getRootPicture (deprecated)
  // C++ vẽ trực tiếp lên GPU surface qua SkiaKitNativeView.

  // ── Engine Identity (Phase 3: multi-instance) ————————————————————

  /**
   * getEngineId — trả về unique int64 ID của engine này.
   * JS truyền ID này xuống SkiaKitNativeView qua `engineId` prop —
   * native view dùng nó để lookup đúng engine từ registry (không còn singleton).
   */
  getEngineId(): number;

  /**
   * onLayoutComplete — đăng ký callback được gọi sau mỗi C++ layout cycle.
   *
   * Sau khi C++ `doRender()` chạy `calculateLayout` xong, nó gọi callback này
   * trên JS thread — JS thực hiện `getAllLayouts() + updateLayoutSVs()` để
   * cập nhật Reanimated SharedValues cho `useNativeYogaLayout` components.
   *
   * Thay thế cơ chế JS pull (calculateLayout + getAllLayouts trong requestRedraw).
   */
  onLayoutComplete(callback: () => void): void;
}
