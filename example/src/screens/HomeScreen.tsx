import {
  Box,
  Text,
  Icon,
  ScrollView,
  Column,
  useTheme,
} from 'react-native-skia-kit';
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

  // Quick action grid
  const gridGap = 12;
  const itemSize = (width - pad * 2 - gridGap * 3) / 4;

  return (
    <Column width={width} height={height - bottomNavH} color="#F0F4F0">
      {/* ===== Green Header ===== */}
      <Box
        height={120}
        color="#16A34A"
        flexDirection="column"
        justifyContent="end"
        padding={pad}
      >
        <Text
          text="Chào HOÀNG BẢO LONG!"
          fontSize={18}
          fontWeight="bold"
          color="#ffffff"
        />
      </Box>

      {/* ===== Scrollable Content ===== */}
      <ScrollView
        width={width}
        height={height - bottomNavH - 120}
        physics="bouncing"
      >
        {/* Two Action Cards side by side */}
        <Box
          padding={[8, pad, 8, pad]}
          height={80}
          flexDirection="row"
          gap={12}
        >
          {/* Left card */}
          <Box
            flex={1}
            borderRadius={12}
            color={theme.colors.surface}
            elevation={2}
            hitTestBehavior="opaque"
            flexDirection="row"
            alignItems="center"
            padding={12}
            gap={10}
          >
            <Box
              width={36}
              height={36}
              borderRadius={10}
              color="#E8F0FE"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Icon name="menu" size={20} color="#1A73E8" />
            </Box>
            <Column flex={1} mainAxisAlignment="center">
              <Text
                text="Danh sách hóa đơn"
                fontSize={13}
                fontWeight="600"
                color={theme.colors.textBody}
              />
            </Column>
          </Box>

          {/* Right card */}
          <Box
            flex={1}
            borderRadius={12}
            color={theme.colors.surface}
            elevation={2}
            hitTestBehavior="opaque"
            flexDirection="row"
            alignItems="center"
            padding={12}
            gap={10}
          >
            <Box
              width={36}
              height={36}
              borderRadius={10}
              color="#E8F0FE"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Icon name="home" size={20} color="#1A73E8" />
            </Box>
            <Column flex={1} mainAxisAlignment="center">
              <Text
                text="Khu vực làm việc"
                fontSize={13}
                fontWeight="600"
                color={theme.colors.textBody}
              />
            </Column>
          </Box>
        </Box>

        {/* Quick Actions Header */}
        <Box
          padding={[8, pad, 4, pad]}
          flexDirection="row"
          justifyContent="spaceBetween"
          alignItems="center"
        >
          <Text
            text="Thao tác nhanh"
            fontSize={16}
            fontWeight="bold"
            color={theme.colors.textBody}
            flex={1}
          />
          <Text text="Sắp xếp" fontSize={13} color="#1A73E8" />
        </Box>

        {/* Quick Actions Grid */}
        <Box
          padding={[0, pad, 0, pad]}
          flexDirection="row"
          flexWrap="wrap"
          gap={gridGap}
        >
          {quickActions.map((action) => (
            <QuickActionItem
              key={action.id}
              size={itemSize}
              icon={action.icon}
              label={action.label}
              color={action.color}
              bgColor={action.bgColor}
            />
          ))}
        </Box>
      </ScrollView>
    </Column>
  );
}
