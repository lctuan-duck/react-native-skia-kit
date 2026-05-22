import { create } from 'zustand';
import type { NativeComputedLayout } from '../hooks/useNativeYogaLayout';

/**
 * layoutStore — Legacy store, được giữ lại chỉ để backward compat.
 *
 * ## V2: Store này KHÔNG còn là nguồn dữ liệu layout.
 *
 * Trong v2, layout flow là:
 *   CanvasRoot.requestRedraw()
 *     → uiEngine.calculateLayout(canvasId, w, h)
 *     → updateLayoutSVs(allLayouts)  ← kết quả lưu vào layoutRegistry SharedValues
 *
 * `useNativeYogaLayout` đọc trực tiếp từ layoutRegistry SharedValues.
 * `layoutMap` ở đây không bao giờ được cập nhật trong v2 → bỏ qua hoàn toàn.
 *
 * Các method như `appendChild`, `removeChild`, `triggerLayout` là no-op vì:
 *   - Tree management: do Reconciler (addRenderChild/removeRenderChild) lo
 *   - Layout trigger: do CanvasRoot.requestRedraw() → calculateLayout() lo
 */
export interface LayoutState {
  /** @deprecated Không còn được cập nhật trong v2. Dùng layoutRegistry SharedValues. */
  layoutMap: Record<string, { rect: NativeComputedLayout }>;
  /** @deprecated No-op trong v2 */
  updateLayout: (id: string, layout: NativeComputedLayout) => void;
  /** @deprecated No-op trong v2 — Reconciler xử lý tree */
  appendChild: (parentId: string, childId: string) => void;
  /** @deprecated No-op trong v2 — Reconciler xử lý tree */
  removeChild: (parentId: string, childId: string) => void;
  /** @deprecated No-op trong v2 — CanvasRoot.requestRedraw() lo */
  triggerLayout: () => void;
}

export const useLayoutStore = create<LayoutState>(() => ({
  layoutMap: {},

  // No-ops trong v2
  updateLayout: (_id, _layout) => {},
  appendChild: (_parentId, _childId) => {},
  removeChild: (_parentId, _childId) => {},
  triggerLayout: () => {
    // No-op — calculateLayout được gọi bởi CanvasRoot.requestRedraw()
    // với đúng (rootId, width, height) args sau mỗi Reconciler batch commit.
  },
}));
