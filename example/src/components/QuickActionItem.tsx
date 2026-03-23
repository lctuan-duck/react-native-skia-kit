import { Box, Text, Icon, useTheme } from 'react-native-skia-kit';

interface QuickActionItemProps {
  size: number;
  label: string;
  color: string;
  bgColor: string;
  icon?: string;
  onPress?: () => void;
}

/**
 * QuickActionItem — icon tile for dashboard quick actions grid.
 * Uses flex layout — no manual x/y.
 */
export function QuickActionItem({ size, label, color, bgColor, icon, onPress }: QuickActionItemProps) {
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
        <Icon name={icon ?? 'star'} size={22} color={color} />
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
