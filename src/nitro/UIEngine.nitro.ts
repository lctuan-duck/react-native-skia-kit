import { type HybridObject } from 'react-native-nitro-modules';

export interface NativeLayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
  flexWrap?: string;
  gap?: number;
  rowGap?: number;

  // === Child ===
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number;
  alignSelf?: string;

  // === Dimensions & Constraints ===
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;

  // === Layout Rules ===
  display?: string;          // 'flex' | 'none'
  overflow?: string;         // 'visible' | 'hidden' | 'scroll'
  direction?: string;        // 'inherit' | 'ltr' | 'rtl'

  // === Padding ===
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  // === Margin ===
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;

  // === Position ===
  position?: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export interface UIEngine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // ================= HIT TESTING ================= //

  /**
   * Đăng ký một widget vào hệ thống Hit-Test C++.
   */
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
  
  /**
   * Đánh dấu 1 widget là dynamic (đang được kéo thả/animation).
   * Widget sẽ được đưa ra khỏi QuadTree tĩnh và chuyển sang mảng Linear để tối ưu update.
   */
  setWidgetDynamic(id: string, isDynamic: boolean): void;

  registerScrollArea(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    horizontal: boolean
  ): void;
  updateScrollOffset(id: string, offset: number): void;
  hitTest(x: number, y: number): string[];
  clear(): void;

  // ================= YOGA LAYOUT ================= //

  /**
   * Cập nhật style Flexbox của một Node.
   * Chỉ set property nào có giá trị trong object, bỏ qua undefined.
   */
  updateLayoutNode(id: string, style: NativeYogaStyle): void;

  /**
   * Xoá một Layout Node khỏi cây Flexbox C++ khi Component Unmount.
   */
  removeLayoutNode(id: string): void;

  /**
   * Cập nhật danh sách con của một Node.
   */
  setChildren(parentId: string, childrenIds: string[]): void;

  /**
   * Bắt đầu tính toán Layout từ root node.
   */
  calculateLayout(rootId: string, width: number, height: number): void;

  /**
   * Lấy LayoutRect đã được tính toán.
   */
  getNodeLayout(id: string): NativeLayoutRect;

  /**
   * Lấy toàn bộ LayoutRects trong một lần gọi (batch).
   */
  getAllLayouts(): Record<string, NativeLayoutRect>;
}
