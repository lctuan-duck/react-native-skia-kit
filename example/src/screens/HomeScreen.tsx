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
    <Column style={{ width, height: height - bottomNavH, backgroundColor: '#F0F4F0' }}>
      {/* ===== Green Header ===== */}
      <Box
        style={{
          height: 120,
          backgroundColor: '#16A34A',
          flexDirection: 'column',
          justifyContent: 'end',
          padding: pad,
        }}
      >
        <Text
          text="Chào HOÀNG BẢO LONG!"
          style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}
        />
      </Box>

      {/* ===== Scrollable Content ===== */}
      <ScrollView
        physics="bouncing"
        style={{ width, height: height - bottomNavH - 120 }}
      >
        {/* Two Action Cards side by side */}
        <Box
          style={{
            padding: [8, pad, 8, pad],
            height: 80,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          {/* Left card */}
          <Box
            hitTestBehavior="opaque"
            style={{
              flex: 1,
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              elevation: 2,
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              gap: 10,
            }}
          >
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#E8F0FE',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="menu" size={20} color="#1A73E8" />
            </Box>
            <Column style={{ flex: 1 }} mainAxisAlignment="center">
              <Text
                text="Danh sách hóa đơn"
                style={{ fontSize: 13, fontWeight: '600', color: theme.colors.textBody }}
              />
            </Column>
          </Box>

          {/* Right card */}
          <Box
            hitTestBehavior="opaque"
            style={{
              flex: 1,
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              elevation: 2,
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              gap: 10,
            }}
          >
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#E8F0FE',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="home" size={20} color="#1A73E8" />
            </Box>
            <Column style={{ flex: 1 }} mainAxisAlignment="center">
              <Text
                text="Khu vực làm việc"
                style={{ fontSize: 13, fontWeight: '600', color: theme.colors.textBody }}
              />
            </Column>
          </Box>
        </Box>

        {/* Quick Actions Header */}
        <Box
          style={{
            padding: [8, pad, 4, pad],
            flexDirection: 'row',
            justifyContent: 'spaceBetween',
            alignItems: 'center',
          }}
        >
          <Text
            text="Thao tác nhanh"
            style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.textBody, flex: 1 }}
          />
          <Text text="Sắp xếp" style={{ fontSize: 13, color: '#1A73E8' }} />
        </Box>

        {/* Quick Actions Grid */}
        <Box
          style={{
            padding: [0, pad, 0, pad],
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: gridGap,
          }}
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
