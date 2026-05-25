import * as React from 'react';
import { Box } from '../Box';
import type { BoxProps } from '../../types/widget.types';
import { useWidgetId } from '../../hooks/useWidgetId';
import { useSkiaAnimatedStyle } from '../../hooks/useSkiaAnimatedStyle';
import type { SharedValue } from 'react-native-reanimated';
import type { NativeAnimatedStyle } from '../../nitro/UIEngine.nitro';

export interface AnimatedBoxProps extends Omit<BoxProps, 'style'> {
  /**
   * Style tĩnh hoặc style động từ Reanimated (SharedValue trả về từ useDerivedValue).
   */
  style?: BoxProps['style'] | SharedValue<NativeAnimatedStyle>;
}

/**
 * Animated.Box component.
 * Hoạt động tương tự `Animated.View` của React Native Reanimated.
 * Tự động parse animated style và cập nhật xuống C++ Engine với tốc độ 120fps.
 */
export const AnimatedBox = React.forwardRef<any, AnimatedBoxProps>(
  (props, ref) => {
    const { style, id: propId, ...rest } = props;
    const widgetId = useWidgetId('animated_box');
    const finalId = propId ?? widgetId;

    // Kiểm tra xem style truyền vào có phải là SharedValue (có thuộc tính .value) hay không
    const isAnimatedStyle =
      style && typeof style === 'object' && 'value' in style;

    // Trích xuất giá trị ban đầu để render tĩnh frame đầu tiên
    const initialStyle = isAnimatedStyle
      ? (style as SharedValue<NativeAnimatedStyle>).value
      : (style as BoxProps['style']);

    // Luôn gọi hook để tuân thủ Rule of Hooks, nhưng truyền undefined nếu không phải animated style
    useSkiaAnimatedStyle(
      finalId,
      isAnimatedStyle ? (style as SharedValue<NativeAnimatedStyle>) : undefined
    );

    // Box lõi nhận initialStyle tĩnh, sau đó C++ sẽ nhận override liên tục từ useSkiaAnimatedStyle
    return <Box id={finalId} ref={ref} style={initialStyle as any} {...rest} />;
  }
);
