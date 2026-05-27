/**
 * DisplayTab — Cards, Avatar, Badge, Chip, ListTile, ExpansionTile, Divider, Tooltip
 */
import * as React from 'react';
import {
  ScrollView,
  Column,
  Row,
  Box,
  Text,
  Divider,
  Card,
  Avatar,
  Badge,
  Chip,
  ListTile,
  ExpansionTile,
  Icon,
  Switch,
} from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit';
import { SectionHeader } from '../components/SectionHeader';

interface Props {
  width: number;
  height: number;
}

export function DisplayTab({ width, height }: Props) {
  const theme = useTheme();
  const [switchOn, setSwitchOn] = React.useState(false);
  const [selectedChips, setSelectedChips] = React.useState<number[]>([0]);

  const toggleChip = (i: number) => {
    setSelectedChips((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  return (
    <ScrollView style={{ width, height }}>
      <Column style={{ gap: 0, padding: 0 }}>

        {/* ── Cards ── */}
        <SectionHeader title="Card" />
        <Column style={{ gap: 12, padding: 16 }}>
          <Card variant="solid" style={{ width: width - 32, padding: 16 }}>
            <Text
              text="Solid Card"
              style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.textBody }}
            />
            <Box style={{ height: 4 }} />
            <Text
              text="Elevated card with shadow, uses theme.colors.surface"
              style={{ fontSize: 14, color: theme.colors.textSecondary }}
            />
          </Card>
          <Card variant="outline" style={{ width: width - 32, padding: 16 }}>
            <Text
              text="Outline Card"
              style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.textBody }}
            />
            <Box style={{ height: 4 }} />
            <Text
              text="Bordered card, elevation = 0"
              style={{ fontSize: 14, color: theme.colors.textSecondary }}
            />
          </Card>
          <Card variant="ghost" style={{ width: width - 32, padding: 16 }}>
            <Text
              text="Ghost Card"
              style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.textBody }}
            />
            <Box style={{ height: 4 }} />
            <Text
              text="Surface variant background, no border"
              style={{ fontSize: 14, color: theme.colors.textSecondary }}
            />
          </Card>
        </Column>

        {/* ── Gradient Boxes ── */}
        <SectionHeader title="Gradient (Box style)" />
        <Column style={{ gap: 10, padding: 16 }}>
          <Box
            style={{
              width: width - 32,
              height: 64,
              borderRadius: 12,
              gradient: {
                type: 'linear',
                colors: [theme.colors.primary, theme.colors.secondary],
                startX: 0, startY: 0,
                endX: 1, endY: 0,
              },
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              text="Linear Gradient"
              style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}
            />
          </Box>
          <Box
            style={{
              width: width - 32,
              height: 64,
              borderRadius: 12,
              gradient: {
                type: 'radial',
                colors: [theme.colors.success, theme.colors.primary],
                centerX: 0.5, centerY: 0.5,
                radius: 0.8,
              },
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              text="Radial Gradient"
              style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}
            />
          </Box>
          <Box
            style={{
              width: width - 32,
              height: 64,
              borderRadius: 12,
              gradient: {
                type: 'sweep',
                colors: [theme.colors.error, theme.colors.warning, theme.colors.success, theme.colors.primary, theme.colors.error],
                centerX: 0.5, centerY: 0.5,
              },
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              text="Sweep Gradient"
              style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}
            />
          </Box>
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── Avatar ── */}
        <SectionHeader title="Avatar" />
        <Row style={{ gap: 16, padding: 16, alignItems: 'center' }}>
          <Column style={{ alignItems: 'center', gap: 6 }}>
            <Avatar variant="circle" size={56} color="primary" status="online" />
            <Text text="Online" style={{ fontSize: 11, color: theme.colors.textSecondary }} />
          </Column>
          <Column style={{ alignItems: 'center', gap: 6 }}>
            <Avatar variant="rounded" size={56} color="secondary" status="offline" />
            <Text text="Offline" style={{ fontSize: 11, color: theme.colors.textSecondary }} />
          </Column>
          <Column style={{ alignItems: 'center', gap: 6 }}>
            <Avatar variant="square" size={56} color="success" />
            <Text text="Square" style={{ fontSize: 11, color: theme.colors.textSecondary }} />
          </Column>
          <Column style={{ alignItems: 'center', gap: 6 }}>
            <Avatar variant="circle" size={56} color="error" />
            <Text text="Error" style={{ fontSize: 11, color: theme.colors.textSecondary }} />
          </Column>
        </Row>

        <Divider style={{ length: width - 32 }} />

        {/* ── Badge ── */}
        <SectionHeader title="Badge" />
        <Row style={{ gap: 20, padding: 16, alignItems: 'center' }}>
          <Box>
            <Avatar variant="circle" size={48} color="neutral" />
            <Box style={{ position: 'absolute', top: 0, right: 0 }}>
              <Badge variant="standard" value={3} color="error" />
            </Box>
          </Box>
          <Box>
            <Avatar variant="circle" size={48} color="neutral" />
            <Box style={{ position: 'absolute', top: 0, right: 0 }}>
              <Badge variant="standard" value={99} color="primary" />
            </Box>
          </Box>
          <Box>
            <Avatar variant="circle" size={48} color="neutral" />
            <Box style={{ position: 'absolute', top: 2, right: 2 }}>
              <Badge variant="dot" color="success" />
            </Box>
          </Box>
          <Badge variant="standard" value={150} color="warning" />
          <Badge variant="standard" value={7} color="info" size={24} />
        </Row>

        <Divider style={{ length: width - 32 }} />

        {/* ── Chip ── */}
        <SectionHeader title="Chip" />
        <Column style={{ gap: 10, padding: 16 }}>
          <Row style={{ gap: 8 }}>
            {['React', 'Native', 'Skia', 'Kit', 'UI'].map((label, i) => (
              <Chip
                key={i}
                label={label}
                variant="solid"
                color="primary"
                selected={selectedChips.includes(i)}
                onPress={() => toggleChip(i)}
              />
            ))}
          </Row>
          <Row style={{ gap: 8 }}>
            {['Outline', 'Ghost'].map((label, i) => (
              <Chip
                key={i}
                label={label}
                variant={i === 0 ? 'outline' : 'ghost'}
                color="secondary"
                selected={i === 0}
              />
            ))}
          </Row>
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── ListTile ── */}
        <SectionHeader title="ListTile" />
        <Column style={{ gap: 0 }}>
          <ListTile
            title="Standard ListTile"
            subtitle="With leading icon and trailing switch"
            leading={<Icon name="bell" size={24} color={theme.colors.primary} />}
            trailing={<Switch value={switchOn} onChange={setSwitchOn} />}
          />
          <Divider style={{ length: width }} />
          <ListTile
            title="Dense ListTile"
            dense
            leading={<Avatar variant="circle" size={36} color="success" />}
            trailing={<Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />}
            onPress={() => {}}
          />
          <Divider style={{ length: width }} />
          <ListTile
            title="No subtitle"
            trailing={<Badge variant="dot" color="error" />}
            onPress={() => {}}
          />
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── ExpansionTile ── */}
        <SectionHeader title="ExpansionTile" />
        <ExpansionTile
          title="Features"
          subtitle="Tap to expand"
          leading={<Icon name="list" size={20} color={theme.colors.primary} />}
          style={{ width }}
        >
          <Column style={{ gap: 8 }}>
            <Text text="✓ 60fps animations via Reanimated + C++ bridge" style={{ fontSize: 14, color: theme.colors.textBody }} />
            <Text text="✓ Yoga layout engine" style={{ fontSize: 14, color: theme.colors.textBody }} />
            <Text text="✓ Hero shared element transitions" style={{ fontSize: 14, color: theme.colors.textBody }} />
            <Text text="✓ Skia-rendered UI components" style={{ fontSize: 14, color: theme.colors.textBody }} />
          </Column>
        </ExpansionTile>
        <ExpansionTile
          title="Performance"
          leading={<Icon name="activity" size={20} color={theme.colors.success} />}
          style={{ width }}
        >
          <Text text="Worklet → scheduleOnRN → C++ → Skia pipeline" style={{ fontSize: 14, color: theme.colors.textBody }} />
        </ExpansionTile>

        {/* Bottom padding */}
        <Box style={{ height: 24 }} />
      </Column>
    </ScrollView>
  );
}
