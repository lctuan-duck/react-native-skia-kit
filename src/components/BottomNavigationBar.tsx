import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Expanded } from './Expanded';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  ShadowStyle,
  FlexChildStyle,
} from '../core/style.types';

// === BottomNavigationBar Types ===

export interface BottomNavItem {
  icon: string;
  label: string;
  activeIcon?: string;
}

export type BottomNavigationBarStyle = ColorStyle &
  ShadowStyle &
  FlexChildStyle & {
    activeColor?: string;
    inactiveColor?: string;
    width?: number;
    height?: number;
  };

export interface BottomNavigationBarProps extends WidgetProps {
  items: BottomNavItem[];
  activeIndex?: number;
  /** Style override */
  style?: BottomNavigationBarStyle;
  onChange?: (index: number) => void;
}

export const BottomNavigationBar = React.memo(function BottomNavigationBar({
  x = 0,
  y,
  items,
  activeIndex = 0,
  style,
  onChange,
}: BottomNavigationBarProps) {
  const theme = useTheme();
  const bgColor = style?.backgroundColor ?? theme.colors.surface;
  const active = style?.activeColor ?? theme.colors.primary;
  const inactive = style?.inactiveColor ?? theme.colors.textSecondary;
  const elev = style?.elevation ?? 8;
  const width = style?.width ?? 360;
  const height = style?.height ?? 64;
  const barY = y ?? 800 - height;

  useWidget({
    type: 'BottomNavigationBar',
    layout: { x, y: barY, width, height },
  });

  return (
    <Box
      x={x}
      y={barY}
      style={{
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
