import { useState } from 'react';
import { getOrCreateLayoutSV, snapshotLayout } from '../stores/layoutRegistry';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';

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

  const sv = getOrCreateLayoutSV(widgetId);
  const svX = sv.x;
  const svY = sv.y;
  const svW = sv.width;
  const svH = sv.height;

  // Sync state whenever the shared values change (Yoga layout resolved)
  useAnimatedReaction(
    () => ({
      x: svX.value,
      y: svY.value,
      width: svW.value,
      height: svH.value,
    }),
    (curr, prev) => {
      if (
        curr.width !== prev?.width ||
        curr.height !== prev?.height ||
        curr.x !== prev?.x ||
        curr.y !== prev?.y
      ) {
        runOnJS(setLayout)({ ...curr });
      }
    },
    [svX, svY, svW, svH]
  );

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
