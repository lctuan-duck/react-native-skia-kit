import { Box, Text, useTheme } from 'react-native-skia-kit';

interface QuickActionItemProps {
  size: number;
  label: string;
  color: string;
  bgColor: string;
  onPress?: () => void;
}

/**
 * QuickActionItem — icon tile for dashboard quick actions grid.
 * Uses flex layout — no manual x/y.
 */
export function QuickActionItem({ size, label, color, bgColor, onPress }: QuickActionItemProps) {
  const theme = useTheme();
  const iconBoxSize = size * 0.55;

  return (
    <Box
      width={size} height={size + 24}
      hitTestBehavior="opaque"
      onPress={onPress}
      flexDirection="column" alignItems="center" gap={6}
    >
      {/* Icon circle */}
      <Box
        width={iconBoxSize} height={iconBoxSize}
        borderRadius={14}
        color={bgColor}
        flexDirection="column" justifyContent="center" alignItems="center"
      >
        <Box width={20} height={20} borderRadius={10} color={color} />
      </Box>

      {/* Label */}
      <Text
        width={size}
        text={label}
        fontSize={11}
        color={theme.colors.textBody}
        textAlign="center"
        height={28}
      />
    </Box>
  );
}
