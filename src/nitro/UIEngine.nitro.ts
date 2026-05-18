import { type HybridObject } from 'react-native-nitro-modules';

export interface NativeLayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
   * Để giảm overhead JSI, dùng string cho ENUM (VD: 'row', 'column', 'center', 'flex-start'...)
   * Kích thước mảng padding/margin: [top, right, bottom, left]. Nếutruyền -1 thì bỏ qua.
   */
  updateLayoutNode(
    id: string,
    flexDirection: string,
    justifyContent: string,
    alignItems: string,
    flexWrap: string,
    width: number,
    height: number,
    flex: number,
    gap: number,
    paddingTop: number,
    paddingRight: number,
    paddingBottom: number,
    paddingLeft: number
  ): void;

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
