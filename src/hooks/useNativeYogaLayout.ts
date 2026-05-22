import { useEffect, useRef, useState } from 'react';
import { getOrCreateLayoutSV, snapshotLayout } from '../stores/layoutRegistry';

/**
 * NativeComputedLayout — layout kết quả được tính bởi C++ Yoga engine.
 */
export interface NativeComputedLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Re-export để backward compat với các import cũ
export type ComponentYogaStyle = Record<string, any>;

export const DEFAULT_LAYOUT: NativeComputedLayout = { x: 0, y: 0, width: 0, height: 0 };

/**
 * useNativeYogaLayout — Đọc computed layout từ C++ Yoga engine.
 *
 * ## V2 Architecture
 *
 * Trong v2, layout được tính hoàn toàn trong C++:
 *
 *   CanvasRoot.requestRedraw()
 *     → uiEngine.calculateLayout(canvasId, w, h)  // Yoga
 *     → AUTO-BRIDGE → syncLayoutResults()          // → RenderSubsystem
 *     → updateLayoutSVs(layouts)                   // → layoutRegistry SharedValues
 *
 * **KHÔNG cần** gọi `uiEngine.updateLayoutNode()` từ component nữa —
 * Reconciler `createInstance` đã gọi `createBoxNode()` → `_layoutSubsystem.updateLayoutNode()`.
 *
 * ## Khi nào dùng hook này
 *
 * Chỉ dùng khi component cần biết computed dimensions để tính logic UI:
 * - `TabBar`: `tabWidth = computedWidth / items.length`
 * - `Slider`, `Progress`: track fill width
 * - `VirtualizedList`: clip bounds, scroll range
 *
 * Nếu chỉ render Box/Text thông thường → KHÔNG cần hook này.
 *
 * ## Fallback
 *
 * Lần render đầu tiên (trước calculateLayout), hook trả về fallback từ props.
 * Sau khi CanvasRoot.requestRedraw() chạy, SharedValues được cập nhật và
 * component re-render với giá trị thực từ Yoga.
 *
 * @param widgetId - ID stable của widget (từ useWidgetId)
 * @param fallback - Props width/height làm fallback khi Yoga chưa tính xong
 * @param _unused - Kept for backward compat (old API accepted childrenIds or style)
 */
export function useNativeYogaLayout(
  widgetId: string,
  fallback?: { width?: number | string; height?: number | string },
  _unused?: any
): NativeComputedLayout {
  // Khởi tạo với snapshot hiện tại (có thể là 0 nếu chưa có layout)
  const [layout, setLayout] = useState<NativeComputedLayout>(() => {
    const snap = snapshotLayout(widgetId);
    if (snap.width > 0 || snap.height > 0) {
      return snap; // Layout đã được tính trước đó (e.g. từ hot reload)
    }
    // Fallback về props khi layout chưa có
    return {
      x: 0,
      y: 0,
      width: parseFallbackDimension(fallback?.width),
      height: parseFallbackDimension(fallback?.height),
    };
  });

  const sv = useRef(getOrCreateLayoutSV(widgetId));

  useEffect(() => {
    // Đảm bảo widgetId có SharedValue entry sẵn để updateLayoutSVs có thể cập nhật
    sv.current = getOrCreateLayoutSV(widgetId);

    // Interval nhẹ để poll SharedValues sau khi CanvasRoot.requestRedraw() chạy.
    // Dùng interval ngắn (100ms) thay vì addListener vì Reanimated addListener
    // không phải stable API và có thể gây warnings.
    //
    // Trong thực tế, component sẽ re-render khi parent state thay đổi → useEffect
    // chạy lại → syncLayout() lấy giá trị mới. Interval chỉ là safety net.
    let frameId: ReturnType<typeof requestAnimationFrame> | null = null;
    let active = true;

    function syncLayout() {
      if (!active) return;
      const snap = snapshotLayout(widgetId);
      if (snap.width > 0 || snap.height > 0) {
        setLayout((prev) => {
          // Tránh re-render nếu giá trị không đổi
          if (
            prev.x === snap.x &&
            prev.y === snap.y &&
            prev.width === snap.width &&
            prev.height === snap.height
          ) {
            return prev;
          }
          return snap;
        });
      }
    }

    // Sync ngay lập tức sau mount (layout có thể đã có từ lần render trước)
    syncLayout();

    // Sau 1 animation frame, thử lại — CanvasRoot thường chạy requestRedraw
    // trong useLayoutEffect, hoàn tất trước khi frame tiếp theo paint
    frameId = requestAnimationFrame(() => {
      if (active) syncLayout();
    });

    return () => {
      active = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [widgetId]);

  return layout;
}

/**
 * Chuyển fallback dimension → number.
 * '100%' → 0 (unknown, Yoga sẽ tính sau)
 * 360 → 360
 */
function parseFallbackDimension(value?: number | string): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && !value.includes('%')) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
