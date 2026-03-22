import * as React from 'react';
import { useState } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Column } from './Column';
import { Expanded } from './Expanded';
import { Overlay } from './Overlay';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface DropdownItem<T = string> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface DropdownButtonProps<T = string> extends WidgetProps {
  /** Items to display — REQUIRED */
  items: DropdownItem<T>[];
  /** Current selected value */
  value?: T;
  /** Placeholder text */
  placeholder?: string;
  /** Change callback */
  onChanged?: (value: T) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Border color */
  borderColor?: string;
  /** Border radius */
  borderRadius?: number;
  /** Max dropdown height */
  dropdownMaxHeight?: number;
  /** Screen width for backdrop */
  screenWidth?: number;
  /** Screen height for backdrop */
  screenHeight?: number;
}

/**
 * DropdownButton — select one value from a list.
 * Tương đương Flutter DropdownButton.
 */
export const DropdownButton = React.memo(function DropdownButton<
  T extends string
>({
  x = 0,
  y = 0,
  width = 200,
  height = 48,
  items,
  value,
  placeholder = 'Chọn...',
  onChanged,
  disabled = false,
  borderColor,
  borderRadius = 8,
  dropdownMaxHeight = 240,
  screenWidth = 360,
  screenHeight = 800,
}: DropdownButtonProps<T>) {
  const theme = useTheme();
  const border = borderColor ?? theme.colors.border;
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find((i) => i.value === value);

  useWidget({ type: 'DropdownButton', layout: { x, y, width, height } });

  return (
    <>
      {/* Trigger button */}
      <Box
        x={x}
        y={y}
        width={width}
        height={height}
        borderRadius={borderRadius}
        borderWidth={1}
        borderColor={border}
        color={theme.colors.surface}
        hitTestBehavior="opaque"
        onPress={() => !disabled && setIsOpen(!isOpen)}
        flexDirection="row"
        alignItems="center"
        padding={[0, 12, 0, 12]}
        opacity={disabled ? 0.5 : 1}
      >
        <Expanded>
          <Text
            text={selectedItem?.label ?? placeholder}
            fontSize={14}
            color={
              selectedItem ? theme.colors.textBody : theme.colors.textDisabled
            }
          />
        </Expanded>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </Box>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop to close */}
          <Overlay
            visible
            color="transparent"
            onPress={() => setIsOpen(false)}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
          />
          <Box
            x={x}
            y={y + height + 4}
            width={width}
            height={Math.min(items.length * 44, dropdownMaxHeight)}
            color={theme.colors.surface}
            borderRadius={borderRadius}
            elevation={8}
            borderWidth={1}
            borderColor={theme.colors.divider}
          >
            <Column>
              {items.map((item) => (
                <Box
                  key={String(item.value)}
                  width={width}
                  height={44}
                  color={
                    item.value === value
                      ? theme.colors.surfaceVariant
                      : 'transparent'
                  }
                  hitTestBehavior="opaque"
                  onPress={() => {
                    if (!item.disabled) {
                      onChanged?.(item.value);
                      setIsOpen(false);
                    }
                  }}
                  flexDirection="row"
                  alignItems="center"
                  padding={[0, 12, 0, 12]}
                  gap={8}
                  opacity={item.disabled ? 0.4 : 1}
                >
                  {item.icon && (
                    <Icon
                      name={item.icon}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  )}
                  <Text
                    text={item.label}
                    fontSize={14}
                    color={
                      item.value === value
                        ? theme.colors.primary
                        : theme.colors.textBody
                    }
                    fontWeight={item.value === value ? 'bold' : 'normal'}
                  />
                </Box>
              ))}
            </Column>
          </Box>
        </>
      )}
    </>
  );
}) as <T extends string>(
  props: DropdownButtonProps<T> & { ref?: React.Ref<any> }
) => React.ReactElement | null;
