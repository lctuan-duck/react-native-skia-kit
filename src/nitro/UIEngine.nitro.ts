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
 * NativeBoxProps — Visual props cho BoxNode.
 * Màu sắc dùng SkColor format (ARGB packed uint32, ví dụ: 0xFF2196F3).
 */
export interface NativeBoxProps {
  backgroundColor?: number; // SkColor ARGB
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: number;     // SkColor ARGB
  elevation?: number;       // Android shadow / iOS drop shadow
  overflowHidden?: boolean;
}

/**
 * NativeTextProps — Text content + style cho TextNode.
 */
export interface NativeTextProps {
  content: string;
  fontSize?: number;
  color?: number;         // SkColor ARGB
  fontFamily?: string;
  fontWeight?: number;    // 100 – 900
  textAlign?: string;     // 'left' | 'center' | 'right'
  numberOfLines?: number; // 0 = unlimited
}

export interface UIEngine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // ================= HIT TESTING ================= //

  registerWidget(
    id: string, x: number, y: number, w: number, h: number,
    zIndex: number, behavior: number
  ): void;
  unregisterWidget(id: string): void;
  setWidgetDynamic(id: string, isDynamic: boolean): void;
  registerScrollArea(
    id: string, x: number, y: number, w: number, h: number,
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
  createBoxNode(id: string, yogaStyle: NativeYogaStyle, props: NativeBoxProps): void;
  updateBoxNode(id: string, yogaStyle: NativeYogaStyle, props: NativeBoxProps): void;

  // Text
  createTextNode(id: string, yogaStyle: NativeYogaStyle, props: NativeTextProps): void;
  updateTextNode(id: string, yogaStyle: NativeYogaStyle, props: NativeTextProps): void;

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
  createScrollNode(id: string, horizontal: boolean, contentPadding: number): void;
  updateScrollNode(id: string, horizontal: boolean, contentPadding: number): void;

  // Tree structure
  addRenderChild(parentId: string, childId: string): void;
  removeRenderChild(parentId: string, childId: string): void;
  /** Recursive cleanup — xóa node + toàn bộ descendant */
  removeRenderNode(id: string): void;

  /**
   * Sync layout results từ LayoutSubsystem → RenderSubsystem.
   * Thường được gọi tự động trong calculateLayout() (AUTO-BRIDGE).
   * Expose ở đây để JS có thể gọi thủ công nếu cần.
   */
  syncLayoutResults(layouts: Record<string, NativeLayoutRect>): void;

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
