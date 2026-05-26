import { useEffect, useRef } from 'react';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { uiEngine } from '../core/GlobalEngine';
import type { NativeAnimatedStyle } from '../nitro/UIEngine.nitro';

const updateAnimatedStyleJS = (
  id: string | undefined,
  data: NativeAnimatedStyle
) => {
  if (id && uiEngine) {
    uiEngine.updateAnimatedStyles(id, data);
  }
};

/**
 * Hook kết nối React Native Reanimated với C++ Render Engine của SkiaKit.
 *
 * Để tránh việc phải tự viết `'worklet';`, bạn nên kết hợp với `useDerivedValue`
 * của Reanimated.
 *
 * @param widgetId ID của Node trên C++
 * @param style Giá trị SharedValue chứa NativeAnimatedStyle hoặc một hàm updater worklet.
 *
 * @example
 * const scale = useSharedValue(1);
 *
 * // Dùng useDerivedValue (tự động workletized bởi Reanimated)
 * const animatedStyle = useDerivedValue(() => ({
 *   scale: scale.value,
 *   opacity: withSpring(scale.value)
 * }));
 *
 * useSkiaAnimatedStyle(widgetId, animatedStyle);
 */
export function useSkiaAnimatedStyle(
  widgetId: string | undefined,
  style:
    | SharedValue<NativeAnimatedStyle>
    | (() => NativeAnimatedStyle)
    | undefined
) {
  // Biến cờ đánh dấu widgetId hiện tại để tránh cập nhật lầm khi component unmount
  const _widgetIdRef = useRef(widgetId);
  _widgetIdRef.current = widgetId;

  // Lắng nghe thay đổi từ Reanimated Shared Value (Worklet Thread)
  try {
    useAnimatedReaction(
      () => {
        'worklet';
        if (!style) return undefined;
        if (typeof style === 'function') {
          return style();
        }
        return style.value;
      },
      (result) => {
        'worklet';
        if (!result) return;
        // Nitro HybridObject chạy trên JS/C++ Thread. Không thể truyền trực tiếp
        // uiEngine object vào UI Worklet của Reanimated.
        // Phải dùng runOnJS để gọi lại Bridge C++.
        runOnJS(updateAnimatedStyleJS)(_widgetIdRef.current, result);
      },
      [widgetId, style] // Restart reaction khi ID đổi
    );
  } catch {
    // Dự phòng lỗi nếu Reanimated không sẵn sàng trong secondary renderer
  }

  // Effect đảm bảo cleanup logic (nếu cần)
  useEffect(() => {
    return () => {
      _widgetIdRef.current = undefined;
    };
  }, []);
}
