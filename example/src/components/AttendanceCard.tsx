import { Box, Text, Icon } from 'react-native-skia-kit';

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
      hitTestBehavior="opaque"
      style={{
        width,
        height: 72,
        borderRadius: 14,
        backgroundColor: '#16A34A',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
      }}
    >
      {/* Icon */}
      <Box
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.25)',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon name="check" size={22} color="#ffffff" />
      </Box>

      {/* Text content */}
      <Box style={{ height: 44, flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
        <Text
          text="Chấm công"
          style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff', height: 20 }}
        />
        <Text
          text="Còn 45 phút tới ca làm việc"
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', height: 18 }}
        />
      </Box>

      {/* Arrow */}
      <Box
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.2)',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon name="arrow-right" size={16} color="#ffffff" />
      </Box>
    </Box>
  );
}
