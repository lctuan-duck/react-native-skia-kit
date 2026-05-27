import { useEffect, useRef } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useEngine } from '../core/EngineContext';
import type { NativeAnimatedStyle } from '../nitro/UIEngine.nitro';
import { scheduleOnRN } from 'react-native-worklets';

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
  const engine = useEngine();

  const _widgetIdRef = useRef(widgetId);
  _widgetIdRef.current = widgetId;

  // updateAnimatedStyleJS định nghĩa trong hook để capture engine instance đúng
  const updateAnimatedStyleJS = useRef((id: string | undefined, data: NativeAnimatedStyle) => {
    if (id) engine.updateAnimatedStyles(id, data);
  });
  updateAnimatedStyleJS.current = (id, data) => {
    if (id) engine.updateAnimatedStyles(id, data);
  };

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
        const directCall = (global as any).updateAnimatedStylesDirect;
        if (typeof directCall === 'function') {
          directCall(_widgetIdRef.current, result);
        } else {
          scheduleOnRN(updateAnimatedStyleJS.current, _widgetIdRef.current, result);
        }
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
