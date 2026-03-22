import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Expanded } from './Expanded';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface BottomNavItem {
  icon: string;
  label: string;
  activeIcon?: string;
}

export interface BottomNavigationBarProps extends WidgetProps {
  items: BottomNavItem[];
  activeIndex?: number;
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  elevation?: number;
  onChange?: (index: number) => void;
}

export const BottomNavigationBar = React.memo(function BottomNavigationBar({
  x = 0,
  y,
  width = 360,
  height = 64,
  items,
  activeIndex = 0,
  backgroundColor,
  activeColor,
  inactiveColor,
  elevation = 8,
  onChange,
}: BottomNavigationBarProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.surface;
  const active = activeColor ?? theme.colors.primary;
  const inactive = inactiveColor ?? theme.colors.textSecondary;
  const barY = y ?? 800 - height;

  useWidget({
    type: 'BottomNavigationBar',
    layout: { x, y: barY, width, height },
  });

  return (
    <Box
      x={x}
      y={barY}
      width={width}
      height={height}
      color={bgColor}
      elevation={elevation}
      flexDirection="row"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const color = isActive ? active : inactive;
        const iconName =
          isActive && item.activeIcon ? item.activeIcon : item.icon;
        return (
          <Expanded key={index}>
            <Box
              height={height}
              hitTestBehavior="opaque"
              onPress={() => onChange?.(index)}
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              gap={2}
            >
              <Icon name={iconName} size={24} color={color} />
              <Text
                text={item.label}
                fontSize={11}
                color={color}
                fontWeight={isActive ? 'bold' : 'normal'}
              />
            </Box>
          </Expanded>
        );
      })}
    </Box>
  );
});
