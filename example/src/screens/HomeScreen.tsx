import * as React from 'react';
import { Box, Text, ScrollView, useTheme } from 'react-native-skia-kit';
import { AttendanceCard } from '../components/AttendanceCard';
import { QuickActionItem } from '../components/QuickActionItem';
import { quickActions } from '../data/mockData';

interface HomeScreenProps {
  width: number;
  height: number;
}

export function HomeScreen({ width, height }: HomeScreenProps) {
  const theme = useTheme();
  const pad = 16;
  const bottomNavH = 64;

  // Quick action grid config
  const colCount = 4;
  const itemSize = (width - pad * 2 - 12 * 3) / colCount;
  const rowCount = Math.ceil(quickActions.length / colCount);
  const gridHeight = rowCount * (itemSize + 40);
  const totalContentH = 340 + gridHeight;
  const halfW = (width - pad * 2 - 12) / 2;

  return (
    <Box x={0} y={0} width={width} height={height - bottomNavH}
      flexDirection="column" color="#F0F4F0">

      {/* ===== Green Header ===== */}
      <Box width={width} height={120} color="#16A34A"
        flexDirection="column" justifyContent="end" padding={pad}>
        <Text
          text="Chào HOÀNG BẢO LONG!"
          fontSize={18}
          fontWeight="bold"
          color="#ffffff"
          height={24}
          width={width - pad * 2}
        />
      </Box>

      {/* ===== Scrollable Content ===== */}
      <ScrollView
        x={0} y={120}
        width={width} height={height - 120 - bottomNavH}
        contentSize={totalContentH}
        physics="bouncing"
      >
        {/* Green extension */}
        <Box x={0} y={120} width={width} height={30} color="#16A34A" />

        {/* Attendance Card */}
        <Box x={pad} y={130} width={width - pad * 2}>
          <AttendanceCard width={width - pad * 2} />
        </Box>

        {/* ===== Two Action Cards (side by side) ===== */}
        <Box x={pad} y={218} width={width - pad * 2}
          flexDirection="row" gap={12}>

          {/* Left — Danh sách hóa đơn */}
          <Box width={halfW} height={72} borderRadius={12}
            color={theme.colors.surface} elevation={2}
            hitTestBehavior="opaque"
            flexDirection="row" alignItems="center" padding={12} gap={10}>
            <Box width={36} height={36} borderRadius={10} color="#E8F0FE"
              flexDirection="column" justifyContent="center" alignItems="center">
              <Box width={20} height={20} borderRadius={4} color="#1A73E8" />
            </Box>
            <Box flexDirection="column" flex={1}>
              <Text text="Danh sách" fontSize={13} fontWeight="600" color={theme.colors.textBody} height={16} />
              <Text text="hóa đơn" fontSize={13} fontWeight="600" color={theme.colors.textBody} height={16} />
            </Box>
          </Box>

          {/* Right — Khu vực làm việc */}
          <Box width={halfW} height={72} borderRadius={12}
            color={theme.colors.surface} elevation={2}
            hitTestBehavior="opaque"
            flexDirection="row" alignItems="center" padding={12} gap={10}>
            <Box width={36} height={36} borderRadius={10} color="#E8F0FE"
              flexDirection="column" justifyContent="center" alignItems="center">
              <Box width={20} height={20} borderRadius={4} color="#1A73E8" />
            </Box>
            <Box flexDirection="column" flex={1}>
              <Text text="Khu vực" fontSize={13} fontWeight="600" color={theme.colors.textBody} height={16} />
              <Text text="làm việc" fontSize={13} fontWeight="600" color={theme.colors.textBody} height={16} />
            </Box>
          </Box>
        </Box>

        {/* ===== Quick Actions Header ===== */}
        <Box x={pad} y={306} width={width - pad * 2}
          flexDirection="row" justifyContent="spaceBetween" alignItems="center">
          <Text
            text="Thao tác nhanh" fontSize={16} fontWeight="bold"
            color={theme.colors.textBody} height={22} width={150}
          />
          <Box flexDirection="row" alignItems="center" gap={4}
            hitTestBehavior="opaque">
            <Text text="Sắp xếp" fontSize={13} color="#1A73E8" height={18} width={50} />
          </Box>
        </Box>

        {/* ===== Quick Actions Grid ===== */}
        <Box x={pad} y={340} width={width - pad * 2}
          flexDirection="row" flexWrap="wrap" gap={12}>
          {quickActions.map((action) => (
            <QuickActionItem
              key={action.id}
              size={itemSize}
              label={action.label}
              color={action.color}
              bgColor={action.bgColor}
            />
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
}
