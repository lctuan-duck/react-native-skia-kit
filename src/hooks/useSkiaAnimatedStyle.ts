import { useEffect, useRef, useCallback } from 'react';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useEngineContext } from '../core/EngineContext';
import type { NativeAnimatedStyle } from '../nitro/UIEngine.nitro';


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
  const { engine, engineId } = useEngineContext();

  const _widgetIdRef = useRef(widgetId);
  _widgetIdRef.current = widgetId;

  // WORKLET-SAFE: useCallback + runOnJS thay vì mutable ref bị worklet capture
  const updateAnimatedStyleJS = useCallback((id: string | undefined, data: NativeAnimatedStyle) => {
    if (id) engine.updateAnimatedStyles(id, data);
  }, [engine]);

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
        const directCall = (global as any).skiaKitEngines?.[engineId]?.unbox();
        if (directCall) {
          directCall.updateAnimatedStyles(_widgetIdRef.current, result);
        } else {
          runOnJS(updateAnimatedStyleJS)(_widgetIdRef.current, result);
        }
      },
      [widgetId, style, updateAnimatedStyleJS] // Restart reaction khi ID đổi
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
