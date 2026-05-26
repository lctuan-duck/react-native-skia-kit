import * as React from 'react';
import { useWindowDimensions } from 'react-native';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Expanded } from './Expanded';
import { useWidgetId } from '../hooks/useWidgetId';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  ShadowStyle,
  FlexChildStyle,
  LayoutStyle,
  BorderStyle,
} from '../types/style.types';

// === BottomNavigationBar Types ===

export interface BottomNavItem {
  icon: string;
  label: string;
  activeIcon?: string;
}

export type BottomNavigationBarStyle = ColorStyle &
  ShadowStyle &
  FlexChildStyle &
  LayoutStyle &
  BorderStyle & {
    activeColor?: string;
    inactiveColor?: string;
  };

export interface BottomNavigationBarProps extends WidgetProps {
  items: BottomNavItem[];
  activeIndex?: number;
  /** Style override */
  style?: BottomNavigationBarStyle;
  onChange?: (index: number) => void;
}

export const BottomNavigationBar = React.memo(function BottomNavigationBar({
  items,
  activeIndex = 0,
  style,
  onChange,
}: BottomNavigationBarProps) {
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const bgColor = style?.backgroundColor ?? theme.colors.surface;
  const active = style?.activeColor ?? theme.colors.primary;
  const inactive = style?.inactiveColor ?? theme.colors.textSecondary;
  const elev = style?.elevation ?? 8;
  const width = style?.width ?? '100%';
  const height = style?.height ?? 64;
  const numHeight = typeof height === 'number' ? height : 64;
  // Use screen height instead of hardcoded 800
  const barY = screenHeight - numHeight;

  const widgetId = useWidgetId('BottomNavigationBar');

  // Participate in Yoga layout tree
  const layoutResult = useNativeYogaLayout(
    widgetId,
    { ...style, width, height },
    undefined
  );

  const finalX = layoutResult?.x ?? 0;
  const finalY = layoutResult?.y ?? barY;

  return (
    <Box
      style={{
        position: 'absolute',
        left: finalX,
        top: finalY,
        width,
        height,
        backgroundColor: bgColor,
        elevation: elev,
        flexDirection: 'row',
      }}
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const color = isActive ? active : inactive;
        const iconName =
          isActive && item.activeIcon ? item.activeIcon : item.icon;
        return (
          <Expanded key={index}>
            <Box
              style={{
                height,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
              }}
              hitTestBehavior="opaque"
              onPress={() => onChange?.(index)}
            >
              <Icon name={iconName} size={24} color={color} />
              <Text
                text={item.label}
                style={{
                  fontSize: 11,
                  color,
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              />
            </Box>
          </Expanded>
        );
      })}
    </Box>
  );
});

(BottomNavigationBar as any).skiaWidgetType = 'BottomNavigationBar';
