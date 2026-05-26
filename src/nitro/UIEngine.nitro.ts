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
  /** Gradient type: linear, radial, or sweep */
  type: 'linear' | 'radial' | 'sweep';
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
  tileMode?: 'clamp' | 'repeat' | 'mirror';
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
  setWidgetDynamic(id: string, isDynamic: boolean): void;
  registerScrollArea(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    horizontal: boolean
  ): void;
  unregisterScrollArea(id: string): void;
  updateScrollOffset(id: string, offset: number): void;
  hitTest(x: number, y: number): NativeHitResult[];
  clear(): void;

  // ================= YOGA LAYOUT ================= //

  updateLayoutNode(id: string, style: NativeYogaStyle): void;
  removeLayoutNode(id: string): void;
  setChildren(parentId: string, childrenIds: string[]): void;
  calculateLayout(rootId: string, width: number, height: number): void;
  getNodeLayout(id: string): NativeLayoutRect;
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

  // Image — load async ngay khi create
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
  startImageLoad(id: string): void;

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

  /**
   * Sync layout results từ LayoutSubsystem → RenderSubsystem.
   * Thường được gọi tự động trong calculateLayout() (AUTO-BRIDGE).
   * Expose ở đây để JS có thể gọi thủ công nếu cần.
   */
  syncLayoutResults(layouts: Record<string, NativeLayoutRect>): void;
  updateAnimatedStyles(id: string, style: NativeAnimatedStyle): void;

  /** Cập nhật scroll offset — gọi từ Reanimated worklet, không rebuild SkPicture */
  updateScrollNodeOffset(id: string, offset: number): void;

  /**
   * Cập nhật render style (opacity) trực tiếp từ JS worklet cho animation.
   * C++ cập nhật _opacity trên RenderNode và trigger redraw qua _redrawCallback.
   */
  updateRenderNodeStyle(id: string, opacity: number): void;

  /** Đánh dấu dirty → rebuild SkPicture ở frame tiếp theo */
  markDirty(rootId: string): void;

  /**
   * drawTree — trigger C++ rebuild SkPicture (nếu dirty).
   * w/h = logical pixels của viewport.
   * Trong Phase 6E, đây thực ra chỉ gọi markDirty — getRootPicture() mới thực sự rebuild.
   */
  drawTree(rootId: string, w: number, h: number): void;

  /**
   * getRootPicture — serialize SkPicture → ArrayBuffer để JS reconstruct.
   *
   * Canvas Integration (Phase 6E — Serialization Bridge):
   *   C++ builds SkPicture từ Render Tree → serialize → JS reconstruct via:
   *   `const picture = Skia.Picture.MakePicture(new Uint8Array(bytes))`
   *   → canvas.drawPicture(picture) trong useDrawCallback
   *
   * Chỉ gọi khi `hasPictureData() === true` để tránh empty buffer.
   * Overhead chỉ xảy ra khi dirty (lần đầu sau mỗi state change).
   */
  getRootPicture(rootId: string, w: number, h: number): ArrayBuffer;

  /** Fast check — tránh unnecessary getRootPicture() call khi tree rỗng */
  hasPictureData(): boolean;
}
