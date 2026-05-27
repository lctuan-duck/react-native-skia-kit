/**
 * ButtonsTab — Button (tất cả variants + interactive effects), FAB, IconButton, PopupMenu
 */
import * as React from 'react';
import {
  ScrollView,
  Column,
  Row,
  Box,
  Text,
  Divider,
  Button,
  PopupMenuButton,
  type PopupMenuItem,
} from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit';
import { SectionHeader } from '../components/SectionHeader';

interface Props {
  width: number;
  height: number;
}

const MENU_ITEMS: PopupMenuItem[] = [
  { value: 'edit', label: 'Chỉnh sửa', icon: 'edit' },
  { value: 'copy', label: 'Sao chép', icon: 'copy' },
  { value: 'share', label: 'Chia sẻ', icon: 'share' },
  { value: 'divider', label: '', divider: true, enabled: false },
  { value: 'delete', label: 'Xóa', icon: 'trash' },
];

const COLORS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;

export function ButtonsTab({ width, height }: Props) {
  const theme = useTheme();
  const [pressLog, setPressLog] = React.useState('(chưa nhấn)');

  const logPress = (label: string) => {
    setPressLog(`Pressed: ${label} at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <ScrollView style={{ width, height }}>
      <Column style={{ gap: 0 }}>

        {/* ── Solid Buttons ── */}
        <SectionHeader title="Solid — Tất cả màu" />
        <Column style={{ gap: 8, padding: 16 }}>
          {COLORS.map((color) => (
            <Button
              key={color}
              text={color.charAt(0).toUpperCase() + color.slice(1)}
              variant="solid"
              color={color}
              interactive="opacity"
              onPress={() => logPress(`solid/${color}`)}
            />
          ))}
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── Variants ── */}
        <SectionHeader title="Variants — Primary color" />
        <Column style={{ gap: 8, padding: 16 }}>
          {(['solid', 'outline', 'ghost', 'link'] as const).map((variant) => (
            <Button
              key={variant}
              text={variant.charAt(0).toUpperCase() + variant.slice(1)}
              variant={variant}
              color="primary"
              interactive={variant === 'solid' ? 'opacity' : 'bounce'}
              onPress={() => logPress(variant)}
            />
          ))}
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── Interactive Effects ── */}
        <SectionHeader title="Interactive Effects" />
        <Row style={{ gap: 10, padding: 16, flexWrap: 'wrap' }}>
          <Button
            text="Opacity"
            variant="solid"
            color="primary"
            interactive="opacity"
            onPress={() => logPress('opacity')}
          />
          <Button
            text="Bounce"
            variant="solid"
            color="secondary"
            interactive="bounce"
            onPress={() => logPress('bounce')}
          />
          <Button
            text="Ripple"
            variant="solid"
            color="success"
            interactive="ripple"
            onPress={() => logPress('ripple')}
          />
          <Button
            text="None"
            variant="outline"
            color="neutral"
            interactive="none"
            onPress={() => logPress('none')}
          />
        </Row>
        <Box
          style={{
            marginHorizontal: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <Text text={pressLog} style={{ fontSize: 13, color: theme.colors.textSecondary }} />
        </Box>

        <Divider style={{ length: width - 32 }} />

        {/* ── With Icon ── */}
        <SectionHeader title="Button + Icon" />
        <Column style={{ gap: 8, padding: 16 }}>
          <Button
            text="Save"
            icon="check"
            variant="solid"
            color="success"
            onPress={() => logPress('save')}
          />
          <Button
            text="Delete"
            icon="trash"
            variant="outline"
            color="error"
            onPress={() => logPress('delete')}
          />
          <Button
            text="Share"
            icon="share"
            variant="ghost"
            color="primary"
            onPress={() => logPress('share')}
          />
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── Disabled ── */}
        <SectionHeader title="Disabled State" />
        <Row style={{ gap: 10, padding: 16, flexWrap: 'wrap' }}>
          <Button text="Solid" variant="solid" color="primary" disabled />
          <Button text="Outline" variant="outline" color="primary" disabled />
          <Button text="Ghost" variant="ghost" color="primary" disabled />
        </Row>

        <Divider style={{ length: width - 32 }} />

        {/* ── Icon Button ── */}
        <SectionHeader title="IconButton" />
        <Row style={{ gap: 8, padding: 16 }}>
          {['home', 'bell', 'search', 'user', 'settings', 'heart', 'trash', 'share'].map((icon) => (
            <Button
              key={icon}
              icon={icon}
              variant="icon"
              color="primary"
              onPress={() => logPress(`icon/${icon}`)}
            />
          ))}
        </Row>

        <Divider style={{ length: width - 32 }} />

        {/* ── FAB ── */}
        <SectionHeader title="FAB" />
        <Row style={{ gap: 12, padding: 16, alignItems: 'center' }}>
          <Button
            icon="plus"
            variant="fab"
            color="primary"
            onPress={() => logPress('fab')}
          />
          <Button
            icon="edit"
            text="New Post"
            variant="fab"
            color="secondary"
            extended
            onPress={() => logPress('fab-extended')}
          />
        </Row>

        <Divider style={{ length: width - 32 }} />

        {/* ── PopupMenuButton ── */}
        <SectionHeader title="PopupMenuButton" />
        <Row style={{ gap: 12, padding: 16, alignItems: 'center' }}>
          <Text text="Long press or menu icon →" style={{ fontSize: 14, color: theme.colors.textBody }} />
          <PopupMenuButton
            items={MENU_ITEMS}
            icon="more"
            menuWidth={200}
            offset={{ dx: width - 220, dy: 120 }}
            screenWidth={width}
            screenHeight={800}
            onSelected={(v) => logPress(`menu/${v}`)}
          />
        </Row>

        {/* Bottom padding */}
        <Box style={{ height: 24 }} />
      </Column>
    </ScrollView>
  );
}
