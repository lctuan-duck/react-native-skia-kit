import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Row } from './Row';
import { Expanded } from './Expanded';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
} from '../types/style.types';

export type TabBarVariant = 'tab' | 'segment';

export interface TabItem {
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type TabBarStyle = ColorStyle &
  BorderStyle &
  FlexChildStyle & {
    activeColor?: string;
    inactiveColor?: string;
    indicatorColor?: string;
    width?: number;
    height?: number;
  };

export interface TabBarProps extends WidgetProps {
  items: TabItem[];
  activeIndex?: number;
  onChanged?: (index: number) => void;
  variant?: TabBarVariant;
  scrollable?: boolean;
  /** Style override */
  style?: TabBarStyle;
}

export const TabBar = React.memo(function TabBar({
  x = 0,
  y = 0,
  items,
  activeIndex = 0,
  onChanged,
  variant = 'tab',
  style,
}: TabBarProps) {
  const theme = useTheme();
  const active = style?.activeColor ?? theme.colors.primary;
  const inactive = style?.inactiveColor ?? theme.colors.textSecondary;
  const bgColor =
    style?.backgroundColor ??
    (variant === 'segment'
      ? theme.colors.surfaceVariant
      : theme.colors.surface);
  const indicator = style?.indicatorColor ?? active;
  const borderRadius = style?.borderRadius ?? 24;
  const width = style?.width ?? 360;
  const height = style?.height ?? 48;
  const tabWidth = width / items.length;

  useWidget({ type: 'TabBar', layout: { x, y, width, height } });

  if (variant === 'segment') {
    return (
      <Box
        x={x}
        y={y}
        style={{
          width,
          height,
          borderRadius,
          backgroundColor: bgColor,
          flexDirection: 'row',
          padding: 2,
        }}
      >
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <Expanded key={i}>
              <Box
                style={{
                  height: height - 4,
                  borderRadius: borderRadius - 2,
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  elevation: isActive ? 2 : 0,
                  opacity: item.disabled ? 0.4 : 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: item.icon ? 6 : 0,
                }}
                hitTestBehavior="opaque"
                onPress={() => !item.disabled && onChanged?.(i)}
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
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? active : inactive,
                  }}
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
      style={{
        width,
        height,
        backgroundColor: bgColor,
        flexDirection: 'row',
      }}
    >
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <Expanded key={i}>
            <Box
              style={{
                height,
                opacity: item.disabled ? 0.4 : 1,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              hitTestBehavior="opaque"
              onPress={() => !item.disabled && onChanged?.(i)}
            >
              <Row style={{ gap: item.icon ? 6 : 0 }}>
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size={18}
                    color={isActive ? active : inactive}
                  />
                )}
                <Text
                  text={item.label}
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? active : inactive,
                  }}
                />
              </Row>
              {isActive && (
                <Box
                  style={{
                    width: tabWidth * 0.6,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: indicator,
                  }}
                />
              )}
            </Box>
          </Expanded>
        );
      })}
    </Box>
  );
});
