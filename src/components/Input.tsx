import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import { TextInput } from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Box } from './Box';
import { Text } from './Text';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
  SemanticColor,
} from '../core/style.types';
import { resolveSemanticColor } from '../core/colorUtils';

// === Input Types ===

export type InputVariant = 'outline' | 'solid' | 'underlined';

export type InputStyle = ColorStyle &
  BorderStyle &
  FlexChildStyle & {
    width?: number;
    height?: number;
  };

export interface InputProps extends WidgetProps {
  /** Current text value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Secure text entry (password) */
  secureTextEntry?: boolean;
  /** Keyboard type */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Variant */
  variant?: InputVariant;
  /** Semantic color (focus border) */
  color?: SemanticColor;
  /** Style override */
  style?: InputStyle;
  /** Text change callback */
  onChange?: (text: string) => void;
  /** Focus callback */
  onFocus?: () => void;
  /** Blur callback */
  onBlur?: () => void;
}

/**
 * Input — text input field.
 * Hybrid: Native TextInput (invisible) + Skia rendering.
 * Tương đương Flutter TextField / TextFormField.
 */
export const Input = React.memo(function Input({
  x = 0,
  y = 0,
  value = '',
  placeholder = '',
  secureTextEntry = false,
  keyboardType = 'default',
  variant = 'outline',
  color = 'primary',
  style,
  onChange,
  onFocus,
  onBlur,
}: InputProps) {
  const theme = useTheme();
  const focusColor =
    style?.borderColor ?? resolveSemanticColor(color, theme.colors);

  const width = style?.width ?? 280;
  const height = style?.height ?? 48;
  const borderR = style?.borderRadius ?? 8;

  useWidget({ type: 'Input', layout: { x, y, width, height } });

  const placeholderColor = theme.colors.textDisabled;
  const textColor = theme.colors.textBody;

  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [isFocused, setIsFocused] = useState(false);
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    cursorOpacity.value = isFocused
      ? withRepeat(withTiming(0, { duration: 500 }), -1, true)
      : 1;
  }, [isFocused, cursorOpacity]);

  const displayText = secureTextEntry ? '•'.repeat(value.length) : value;
  const showPlaceholder = !displayText && placeholder;

  const cursorX = React.useMemo(() => {
    if (!displayText) return x + 14;
    const {
      Skia,
      TextAlign: SkTextAlign,
    } = require('@shopify/react-native-skia');
    const builder = Skia.ParagraphBuilder.Make({ textAlign: SkTextAlign.Left });
    builder.pushStyle({ color: Skia.Color('#000'), fontSize: 16 });
    builder.addText(displayText);
    builder.pop();
    const para = builder.build();
    para.layout(width - 28);
    const rects = para.getRectsForRange(0, displayText.length);
    if (rects && rects.length > 0) {
      const lastRect = rects[rects.length - 1]!;
      return x + 14 + lastRect.x + lastRect.width;
    }
    return x + 14;
  }, [displayText, x, width]);

  return (
    <>
      {/* Native TextInput (invisible) */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width,
          height,
          opacity: 0,
          fontSize: 16,
        }}
      />

      {/* Skia rendering */}
      <Group>
        {variant === 'underlined' ? (
          <>
            <Box
              x={x}
              y={y}
              style={{
                width,
                height,
                backgroundColor:
                  style?.backgroundColor ?? 'transparent',
              }}
            />
            <Box
              x={x}
              y={y + height - 2}
              style={{
                width,
                height: isFocused ? 2 : 1,
                backgroundColor: isFocused
                  ? focusColor
                  : theme.colors.border,
              }}
            />
          </>
        ) : (
          <Box
            x={x}
            y={y}
            style={{
              width,
              height,
              borderRadius: borderR,
              backgroundColor:
                style?.backgroundColor ??
                (variant === 'solid'
                  ? theme.colors.surfaceVariant
                  : 'transparent'),
              borderWidth:
                variant === 'outline' ? (isFocused ? 2 : 1) : 0,
              borderColor:
                variant === 'outline'
                  ? isFocused
                    ? focusColor
                    : theme.colors.border
                  : 'transparent',
            }}
          />
        )}

        {/* Text display */}
        <Text
          x={x + 14}
          y={y + height / 2 - 8}
          text={showPlaceholder ? placeholder : displayText}
          style={{
            width: width - 28,
            fontSize: 16,
            color: showPlaceholder ? placeholderColor : textColor,
          }}
        />

        {/* Blinking cursor */}
        {isFocused && (
          <Rect
            x={Math.min(cursorX, x + width - 18)}
            y={y + 10}
            width={2}
            height={height - 20}
            color={focusColor}
            opacity={cursorOpacity}
          />
        )}
      </Group>
    </>
  );
});
