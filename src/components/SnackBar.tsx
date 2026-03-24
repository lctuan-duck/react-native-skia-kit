import * as React from 'react';
import { useEffect } from 'react';
import { Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { Box } from './Box';
import { Text } from './Text';
import { Expanded } from './Expanded';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types/widget.types';
import type { ColorStyle, FlexChildStyle } from '../types/style.types';

// === SnackBar Types ===

export type SnackBarStyle = ColorStyle &
  FlexChildStyle & {
    textColor?: string;
  };

export interface SnackBarProps extends WidgetProps {
  visible?: boolean;
  message: string;
  action?: { label: string; onPress: () => void };
  duration?: number;
  screenWidth?: number;
  screenHeight?: number;
  /** Style override */
  style?: SnackBarStyle;
  onDismiss?: () => void;
}

export const SnackBar = React.memo(function SnackBar({
  visible = false,
  message,
  action,
  duration = 3000,
  style,
  screenWidth = 360,
  screenHeight = 800,
  onDismiss,
}: SnackBarProps) {
  const theme = useTheme();
  const bgColor = style?.backgroundColor ?? theme.colors.inverseSurface;
  const fgColor = style?.textColor ?? theme.colors.textInverse;
  const _translateY = useSharedValue(80);

  useWidget({
    type: 'SnackBar',
    layout: {
      x: 8,
      y: screenHeight - 72,
      width: screenWidth - 16,
      height: 48,
    },
  });

  const transform = useDerivedValue(() => [{ translateY: _translateY.value }]);

  useEffect(() => {
    if (visible) {
      _translateY.value = withTiming(0, { duration: 200 });
      const timer = setTimeout(() => {
        _translateY.value = withTiming(80, { duration: 200 });
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      _translateY.value = withTiming(80, { duration: 200 });
      return undefined;
    }
  }, [visible, duration, onDismiss, _translateY]);

  if (!visible) return null;

  return (
    <Group transform={transform}>
      <Box
        x={8}
        y={screenHeight - 72}
        style={{
          width: screenWidth - 16,
          height: 48,
          borderRadius: 8,
          backgroundColor: bgColor,
          elevation: 6,
          flexDirection: 'row',
          alignItems: 'center',
          padding: [0, 16, 0, 16],
        }}
      >
        <Expanded>
          <Text text={message} style={{ fontSize: 14, color: fgColor }} />
        </Expanded>
        {action && (
          <Box hitTestBehavior="opaque" onPress={action.onPress}>
            <Text
              text={action.label}
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: theme.colors.primary,
              }}
            />
          </Box>
        )}
      </Box>
    </Group>
  );
});
