import * as React from 'react';
import { useState } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Expanded } from './Expanded';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  BorderStyle,
  ShadowStyle,
  FlexChildStyle,
} from '../core/style.types';

// === SearchBar Types ===

export type SearchBarStyle = ColorStyle &
  BorderStyle &
  ShadowStyle &
  FlexChildStyle & {
    textColor?: string;
    placeholderColor?: string;
    width?: number;
    height?: number;
  };

export interface SearchBarProps extends WidgetProps {
  value?: string;
  placeholder?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Style override */
  style?: SearchBarStyle;
  onChanged?: (text: string) => void;
  onSubmitted?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const SearchBar = React.memo(function SearchBar({
  x = 0,
  y = 0,
  style,
  value: controlledValue,
  placeholder = 'Tìm kiếm...',
  leading,
  trailing,
  onChanged,
}: SearchBarProps) {
  const theme = useTheme();
  const bgColor = style?.backgroundColor ?? theme.colors.surfaceVariant;
  const phColor = style?.placeholderColor ?? theme.colors.textSecondary;
  const borderR = style?.borderRadius ?? 24;
  const elev = style?.elevation ?? 0;
  const width = style?.width;
  const height = style?.height ?? 48;

  const [internalValue, setInternalValue] = useState('');
  const text = controlledValue ?? internalValue;

  const w = width ?? 0;
  useWidget({ type: 'SearchBar', layout: { x, y, width: w, height } });

  const handleClear = () => {
    setInternalValue('');
    onChanged?.('');
  };

  return (
    <Box
      x={x}
      y={y}
      style={{
        width,
        height,
        backgroundColor: bgColor,
        borderRadius: borderR,
        elevation: elev,
        flexDirection: 'row',
        alignItems: 'center',
        padding: [0, 16, 0, 16],
        gap: 12,
      }}
    >
      {leading ?? <Icon name="search" size={20} color={phColor} />}
      <Expanded>
        <Text
          text={text || placeholder}
          style={{
            fontSize: 14,
            color: text ? theme.colors.textBody : phColor,
          }}
        />
      </Expanded>
      {text.length > 0 &&
        (trailing ?? (
          <Box
            hitTestBehavior="opaque"
            onPress={handleClear}
            style={{ width: 24, height: 24 }}
          >
            <Icon name="close" size={20} color={phColor} />
          </Box>
        ))}
    </Box>
  );
});
