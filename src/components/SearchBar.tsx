import * as React from 'react';
import { useState } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Expanded } from './Expanded';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface SearchBarProps extends WidgetProps {
  value?: string;
  placeholder?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
  borderRadius?: number;
  elevation?: number;
  onChanged?: (text: string) => void;
  onSubmitted?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const SearchBar = React.memo(function SearchBar({
  x = 0,
  y = 0,
  width,
  height = 48,
  value: controlledValue,
  placeholder = 'Tìm kiếm...',
  leading,
  trailing,
  backgroundColor,
  textColor: _textColor,
  placeholderColor,
  borderRadius = 24,
  elevation = 0,
  onChanged,
}: SearchBarProps) {
  const theme = useTheme();
  const bgColor = backgroundColor ?? theme.colors.surfaceVariant;
  const phColor = placeholderColor ?? theme.colors.textSecondary;
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
      width={width}
      height={height}
      color={bgColor}
      borderRadius={borderRadius}
      elevation={elevation}
      flexDirection="row"
      alignItems="center"
      padding={[0, 16, 0, 16]}
      gap={12}
    >
      {leading ?? <Icon name="search" size={20} color={phColor} />}
      <Expanded>
        <Text
          text={text || placeholder}
          fontSize={14}
          color={text ? theme.colors.textBody : phColor}
        />
      </Expanded>
      {text.length > 0 &&
        (trailing ?? (
          <Box
            hitTestBehavior="opaque"
            onPress={handleClear}
            width={24}
            height={24}
          >
            <Icon name="close" size={20} color={phColor} />
          </Box>
        ))}
    </Box>
  );
});
