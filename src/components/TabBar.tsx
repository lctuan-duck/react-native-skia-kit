import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Row } from './Row';
import { Expanded } from './Expanded';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export type TabBarVariant = 'tab' | 'segment';

export interface TabItem {
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface TabBarProps extends WidgetProps {
  items: TabItem[];
  activeIndex?: number;
  onChanged?: (index: number) => void;
  variant?: TabBarVariant;
  activeColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  indicatorColor?: string;
  borderRadius?: number;
  scrollable?: boolean;
}

export const TabBar = React.memo(function TabBar({
  x = 0,
  y = 0,
  width = 360,
  height = 48,
  items,
  activeIndex = 0,
  onChanged,
  variant = 'tab',
  activeColor,
  inactiveColor,
  backgroundColor,
  indicatorColor,
  borderRadius = 24,
}: TabBarProps) {
  const theme = useTheme();
  const active = activeColor ?? theme.colors.primary;
  const inactive = inactiveColor ?? theme.colors.textSecondary;
  const bgColor =
    backgroundColor ??
    (variant === 'segment'
      ? theme.colors.surfaceVariant
      : theme.colors.surface);
  const indicator = indicatorColor ?? active;
  const tabWidth = width / items.length;

  useWidget({ type: 'TabBar', layout: { x, y, width, height } });

  if (variant === 'segment') {
    return (
      <Box
        x={x}
        y={y}
        width={width}
        height={height}
        borderRadius={borderRadius}
        color={bgColor}
        flexDirection="row"
        padding={2}
      >
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <Expanded key={i}>
              <Box
                height={height - 4}
                borderRadius={borderRadius - 2}
                color={isActive ? '#ffffff' : 'transparent'}
                elevation={isActive ? 2 : 0}
                hitTestBehavior="opaque"
                onPress={() => !item.disabled && onChanged?.(i)}
                opacity={item.disabled ? 0.4 : 1}
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                gap={item.icon ? 6 : 0}
              >
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size={16}
                    color={isActive ? active : inactive}
                  />
                )}
                <Text
                  text={item.label}
                  fontSize={13}
                  fontWeight={isActive ? 'bold' : 'normal'}
                  color={isActive ? active : inactive}
                />
              </Box>
            </Expanded>
          );
        })}
      </Box>
    );
  }

  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      color={bgColor}
      flexDirection="row"
    >
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <Expanded key={i}>
            <Box
              height={height}
              hitTestBehavior="opaque"
              onPress={() => !item.disabled && onChanged?.(i)}
              opacity={item.disabled ? 0.4 : 1}
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Row gap={item.icon ? 6 : 0}>
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size={18}
                    color={isActive ? active : inactive}
                  />
                )}
                <Text
                  text={item.label}
                  fontSize={14}
                  fontWeight={isActive ? 'bold' : 'normal'}
                  color={isActive ? active : inactive}
                />
              </Row>
              {isActive && (
                <Box
                  width={tabWidth * 0.6}
                  height={3}
                  borderRadius={1.5}
                  color={indicator}
                />
              )}
            </Box>
          </Expanded>
        );
      })}
    </Box>
  );
});
