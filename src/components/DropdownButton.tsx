import * as React from 'react';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Column } from './Column';
import { Expanded } from './Expanded';
import { Overlay } from './Overlay';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
} from '../types/style.types';

// === DropdownButton Types ===

export interface DropdownItem<T = string> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type DropdownButtonStyle = ColorStyle &
  BorderStyle &
  FlexChildStyle & {
    width?: number;
    height?: number;
    dropdownMaxHeight?: number;
  };

export interface DropdownButtonProps<T = string> extends WidgetProps {
  items: DropdownItem<T>[];
  value?: T;
  placeholder?: string;
  onChanged?: (value: T) => void;
  disabled?: boolean;
  screenWidth?: number;
  screenHeight?: number;
  /** Style override */
  style?: DropdownButtonStyle;
}

export const DropdownButton = React.memo(function DropdownButton<
  T extends string
>({
  items,
  value,
  placeholder = 'Chọn...',
  onChanged,
  disabled = false,
  style,
  // DD2 fix: use useWindowDimensions as default instead of hardcoded 360/800
  screenWidth: screenWidthProp,
  screenHeight: screenHeightProp,
}: DropdownButtonProps<T>) {
  const { width: winW, height: winH } = useWindowDimensions();
  const screenWidth = screenWidthProp ?? winW;
  const screenHeight = screenHeightProp ?? winH;
  const theme = useTheme();
  const border = style?.borderColor ?? theme.colors.border;
  const borderRadius = style?.borderRadius ?? 8;
  const width = style?.width ?? 200;
  const height = style?.height ?? 48;
  const dropdownMaxHeight = style?.dropdownMaxHeight ?? 240;

  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find((i) => i.value === value);

  const widgetId = useWidgetId('DropdownButton');
  const layout = useNativeYogaLayout(widgetId, { width, height });

  const finalWidth =
    layout?.width > 0 ? layout.width : typeof width === 'number' ? width : 200;
  const finalHeight =
    layout?.height > 0
      ? layout.height
      : typeof height === 'number'
      ? height
      : 48;
  const finalY = layout?.y ?? 0;

  return (
    <>
      <Box
        id={widgetId}
        style={{
          width,
          height,
          borderRadius,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: style?.backgroundColor ?? theme.colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          padding: [0, 12, 0, 12],
          opacity: disabled ? 0.5 : 1,
        }}
        hitTestBehavior="opaque"
        onPress={() => !disabled && setIsOpen(!isOpen)}
      >
        <Expanded>
          <Text
            text={selectedItem?.label ?? placeholder}
            style={{
              fontSize: 14,
              color: selectedItem
                ? theme.colors.textBody
                : theme.colors.textDisabled,
            }}
          />
        </Expanded>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </Box>

      {isOpen && (
        <>
          <Overlay
            visible
            barrierColor="transparent"
            onPress={() => setIsOpen(false)}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
          />
          <Box
            style={{
              width: finalWidth,
              height: Math.min(items.length * 44, dropdownMaxHeight),
              backgroundColor: theme.colors.surface,
              borderRadius,
              elevation: 8,
              borderWidth: 1,
              borderColor: theme.colors.divider,
              position: 'absolute',
              // DD1 fix: flip to above button if panel would overflow screen bottom.
              top: (() => {
                const panelH = Math.min(items.length * 44, dropdownMaxHeight);
                const belowY = finalY + finalHeight + 4;
                const wouldOverflow = belowY + panelH > screenHeight;
                return wouldOverflow ? finalY - panelH - 4 : belowY;
              })(),
            }}
          >
            <Column>
              {items.map((item) => (
                <Box
                  key={String(item.value)}
                  style={{
                    width: finalWidth,
                    height: 44,
                    backgroundColor:
                      item.value === value
                        ? theme.colors.surfaceVariant
                        : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: [0, 12, 0, 12],
                    gap: 8,
                    opacity: item.disabled ? 0.4 : 1,
                  }}
                  hitTestBehavior="opaque"
                  onPress={() => {
                    if (!item.disabled) {
                      onChanged?.(item.value);
                      setIsOpen(false);
                    }
                  }}
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
                    style={{
                      fontSize: 14,
                      color:
                        item.value === value
                          ? theme.colors.primary
                          : theme.colors.textBody,
                      fontWeight: item.value === value ? 'bold' : 'normal',
                    }}
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

(DropdownButton as any).skiaWidgetType = 'DropdownButton';
