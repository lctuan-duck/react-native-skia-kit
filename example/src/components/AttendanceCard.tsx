import * as React from 'react';
import { Box, Text, useTheme } from 'react-native-skia-kit';

interface AttendanceCardProps {
  width: number;
}

/**
 * AttendanceCard — "Chấm công" card on the Home screen.
 * Uses flex layout — no manual x/y.
 */
export function AttendanceCard({ width }: AttendanceCardProps) {
  return (
    <Box
      width={width} height={72}
      borderRadius={14}
      color="#16A34A"
      hitTestBehavior="opaque"
      flexDirection="row" alignItems="center" padding={12} gap={12}
    >
      {/* Icon */}
      <Box
        width={44} height={44}
        borderRadius={12}
        color="rgba(255,255,255,0.25)"
        flexDirection="column" justifyContent="center" alignItems="center"
      >
        <Box width={24} height={24} borderRadius={12} color="#ffffff" />
      </Box>

      {/* Text content */}
      <Box height={44} flexDirection="column" justifyContent="center" flex={1}>
        <Text
          text="Chấm công"
          fontSize={16}
          fontWeight="bold"
          color="#ffffff"
          height={20}
        />
        <Text
          text="Còn 45 phút tới ca làm việc"
          fontSize={13}
          color="rgba(255,255,255,0.85)"
          height={18}
        />
      </Box>

      {/* Arrow */}
      <Box
        width={28} height={28}
        borderRadius={14}
        color="rgba(255,255,255,0.2)"
        flexDirection="column" justifyContent="center" alignItems="center"
      >
        <Text text="›" fontSize={18} fontWeight="bold" color="#ffffff" width={10} height={20} />
      </Box>
    </Box>
  );
}
