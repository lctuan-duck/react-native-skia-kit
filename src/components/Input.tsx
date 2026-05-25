import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
  SemanticColor,
} from '../types/style.types';
import { resolveSemanticColor } from '../utils/color';

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
 * Equivalent to Flutter TextField / TextFormField.
 */
export const Input = React.memo(function Input({
  value = '',
  placeholder = '',
  secureTextEntry = false,
  variant = 'outline',
  color = 'primary',
  style,
  onFocus,
}: InputProps) {
  const theme = useTheme();
  const focusColor =
    style?.borderColor ?? resolveSemanticColor(color, theme.colors);

  const width = style?.width ?? 280;
  const height = style?.height ?? 48;
  const borderR = style?.borderRadius ?? 8;

  const widgetId = useWidgetId('Input');

  const placeholderColor = theme.colors.textDisabled;
  const textColor = theme.colors.textBody;

  const [isFocused, setIsFocused] = React.useState(false);

  const handlePress = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const displayText = secureTextEntry ? '•'.repeat(value.length) : value;
  const showPlaceholder = !displayText && placeholder;

  return (
    <Box
      id={widgetId}
      style={{
        width,
        height,
        borderRadius: variant !== 'underlined' ? borderR : 0,
        backgroundColor:
          style?.backgroundColor ??
          (variant === 'solid' ? theme.colors.surfaceVariant : 'transparent'),
        borderWidth: variant === 'outline' ? (isFocused ? 2 : 1) : 0,
        borderBottomWidth:
          variant === 'underlined' ? (isFocused ? 2 : 1) : undefined,
        borderColor: isFocused ? focusColor : theme.colors.border,
        paddingLeft: 14,
        paddingRight: 14,
        justifyContent: 'center',
      }}
      hitTestBehavior="opaque"
      onPress={handlePress}
    >
      {/* Text display */}
      <Text
        text={showPlaceholder ? placeholder : displayText}
        style={{
          width: width - 28,
          fontSize: 16,
          color: showPlaceholder ? placeholderColor : textColor,
          numberOfLines: 1,
        }}
      />
    </Box>
  );
});

(Input as any).skiaWidgetType = 'Input';
