import { getOrCreateLayoutSV } from '../stores/layoutRegistry';
import type { LayoutSharedValues } from '../stores/layoutRegistry';

export type { LayoutSharedValues };

/**
 * useLayoutSharedValues — Trả về raw SharedValues cho Yoga-computed layout của widget.
 *
 * ## Phase 5: Worklet-native layout access
 *
 * Khác với `useNativeYogaLayout` (sync về React state qua `runOnJS`), hook này
 * trả về các SharedValues TRỰC TIẾP — có thể đọc trên worklet thread mà không
 * cần JS thread involvement:
 *
 * ```ts
 * const layoutSVs = useLayoutSharedValues(widgetId);
 * const defaultWidth = typeof width === 'number' ? width : 200;
 *
 * useAnimatedReaction(
 *   () => animValue.value,
 *   (r) => {
 *     'worklet';
 *     // Đọc layout fresh mỗi frame từ SharedValue — KHÔNG qua JS thread
 *     const fw = layoutSVs.width.value > 0 ? layoutSVs.width.value : defaultWidth;
 *     direct(fillId, { width: r * fw });
 *   },
 *   [fillId, defaultWidth]
 *   // ↑ layoutSVs.width là SharedValue STABLE — KHÔNG cần trong deps.
 *   //   Khi layout thay đổi, layoutSVs.width.value tự cập nhật trong C++ push cycle,
 *   //   worklet đọc giá trị mới ngay trong frame tiếp theo — 0 re-registration.
 * );
 * ```
 *
 * ## So sánh với useNativeYogaLayout
 *
 * | | useNativeYogaLayout | useLayoutSharedValues |
 * |---|---|---|
 * | Thread | JS state (re-render) | Worklet-safe |
 * | Layout change | React re-render + worklet re-register | SharedValue.value changes in-place |
 * | Re-registration | YES (finalWidth in deps) | NO |
 * | Use case | JS side (render, calc) | Worklet animation only |
 *
 * ## Khi nào dùng hook này
 *
 * - Animation worklet cần layout: Slider fill, Progress width, TabBar indicator
 * - Muốn eliminate re-registration overhead khi screen rotate
 * - Layout chỉ cần đọc TRONG worklet, không cần trong JSX/render
 *
 * ## Khi nào vẫn dùng useNativeYogaLayout
 *
 * - Cần layout value trong JS render logic (JSX, event handlers)
 * - `ScrollView`, `VirtualizedList` cần JS-side scroll bounds
 *
 * @param widgetId - Widget ID (giống với useWidgetId)
 * @returns LayoutSharedValues — 4 SharedValues (x, y, width, height)
 */
export function useLayoutSharedValues(widgetId: string): LayoutSharedValues {
  // getOrCreateLayoutSV là synchronous, idempotent — safe để call trên mọi render.
  // SharedValue identity stable → worklet closure capture không bị stale.
  return getOrCreateLayoutSV(widgetId);
}
