/**
 * FeedbackTab — Progress (linear + circular + gradient), SnackBar, RefreshIndicator
 * Covers gradient, animation, indeterminate patterns.
 */
import * as React from 'react';
import {
  ScrollView,
  Column,
  Row,
  Box,
  Text,
  Divider,
  Progress,
  SnackBar,
  Button,
  Slider,
  RefreshIndicator,
  Modal,
  BottomSheet,
} from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit';
import { SectionHeader } from '../components/SectionHeader';

interface Props {
  width: number;
  height: number;
}

const PROGRESS_COLORS = [
  'primary',
  'secondary',
  'success',
  'warning',
  'error',
] as const;

export function FeedbackTab({ width, height }: Props) {
  const theme = useTheme();
  const [progressValue, setProgressValue] = React.useState(0.65);
  const [snackVisible, setSnackVisible] = React.useState(false);
  const [snackMsg, setSnackMsg] = React.useState('');
  const [snackHasAction, setSnackHasAction] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [sheetVisible, setSheetVisible] = React.useState(false);

  const showSnack = (msg: string, hasAction = false) => {
    setSnackMsg(msg);
    setSnackHasAction(hasAction);
    setSnackVisible(true);
  };

  const handleRefresh = async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
  };

  return (
    <Box style={{ width, height }}>
      <ScrollView style={{ width, height }}>
        <Column style={{ gap: 0 }}>

          {/* ── Linear Progress — Determinate ── */}
          <SectionHeader title="Progress — Linear (Determinate)" />
          <Column style={{ gap: 14, padding: 16 }}>
            {/* Interactive slider to control progress */}
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text
                text="Value"
                style={{ fontSize: 13, color: theme.colors.textSecondary }}
              />
              <Text
                text={`${Math.round(progressValue * 100)}%`}
                style={{ fontSize: 14, fontWeight: 'bold', color: theme.colors.primary }}
              />
            </Row>
            <Slider
              min={0} max={100} step={1}
              value={Math.round(progressValue * 100)}
              color="primary"
              style={{ width: width - 32 }}
              onChange={(v) => setProgressValue(v / 100)}
            />

            {/* All semantic colors */}
            {PROGRESS_COLORS.map((color, i) => (
              <Column key={color} style={{ gap: 4 }}>
                <Text
                  text={color}
                  style={{ fontSize: 11, color: theme.colors.textSecondary }}
                />
                <Progress
                  variant="linear"
                  value={progressValue * ((i + 5) / 5)} // slightly different values
                  color={color}
                  style={{ width: width - 32 }}
                />
              </Column>
            ))}

            {/* Gradient progress */}
            <Column style={{ gap: 4 }}>
              <Text
                text="Gradient fill (primary → success)"
                style={{ fontSize: 11, color: theme.colors.textSecondary }}
              />
              <Box
                style={{
                  width: width - 32,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                <Box
                  style={{
                    width: (width - 32) * progressValue,
                    height: 8,
                    borderRadius: 4,
                    gradient: {
                      type: 'linear',
                      colors: [theme.colors.primary, theme.colors.success],
                      startX: 0, startY: 0,
                      endX: 1, endY: 0,
                    },
                  }}
                />
              </Box>
            </Column>
          </Column>

          <Divider style={{ length: width - 32 }} />

          {/* ── Linear Progress — Indeterminate ── */}
          <SectionHeader title="Progress — Linear (Indeterminate)" />
          <Column style={{ gap: 10, padding: 16 }}>
            {PROGRESS_COLORS.map((color) => (
              <Progress
                key={color}
                variant="linear"
                color={color}
                style={{ width: width - 32 }}
              />
            ))}
          </Column>

          <Divider style={{ length: width - 32 }} />

          {/* ── Circular Progress ── */}
          <SectionHeader title="Progress — Circular" />
          <Row style={{ gap: 24, padding: 16, alignItems: 'flex-end' }}>
            {([32, 40, 56, 72] as const).map((sz, i) => (
              <Column key={sz} style={{ alignItems: 'center', gap: 6 }}>
                <Progress
                  variant="circular"
                  color={PROGRESS_COLORS[i] ?? 'primary'}
                  style={{ size: sz, strokeWidth: Math.round(sz / 10) + 2 }}
                />
                <Text
                  text={`${sz}px`}
                  style={{ fontSize: 10, color: theme.colors.textSecondary }}
                />
              </Column>
            ))}
            {/* Determinate circular */}
            <Column style={{ alignItems: 'center', gap: 6 }}>
              <Progress
                variant="circular"
                value={progressValue}
                color="error"
                style={{ size: 56, strokeWidth: 6 }}
              />
              <Text
                text="Det."
                style={{ fontSize: 10, color: theme.colors.textSecondary }}
              />
            </Column>
          </Row>

          <Divider style={{ length: width - 32 }} />

          {/* ── SnackBar ── */}
          <SectionHeader title="SnackBar" />
          <Column style={{ gap: 8, padding: 16 }}>
            <Row style={{ gap: 8 }}>
              <Button
                text="Simple"
                variant="solid"
                color="primary"
                interactive="opacity"
                onPress={() => showSnack('Thao tác thành công!')}
              />
              <Button
                text="With Action"
                variant="outline"
                color="primary"
                interactive="bounce"
                onPress={() => showSnack('File đã xóa', true)}
              />
              <Button
                text="Error"
                variant="solid"
                color="error"
                interactive="opacity"
                onPress={() => showSnack('Có lỗi xảy ra. Vui lòng thử lại.')}
              />
            </Row>
          </Column>

          <Divider style={{ length: width - 32 }} />

          {/* ── Modal & BottomSheet ── */}
          <SectionHeader title="Modal & BottomSheet" />
          <Row style={{ gap: 8, padding: 16 }}>
            <Button
              text="Open Modal"
              variant="solid"
              color="secondary"
              interactive="opacity"
              onPress={() => setModalVisible(true)}
            />
            <Button
              text="Open BottomSheet"
              variant="outline"
              color="secondary"
              interactive="bounce"
              onPress={() => setSheetVisible(true)}
            />
          </Row>

          <Divider style={{ length: width - 32 }} />

          {/* ── RefreshIndicator ── */}
          <SectionHeader title="RefreshIndicator" />
          <Box style={{ padding: 16 }}>
            <RefreshIndicator onRefresh={handleRefresh} screenWidth={width}>
              <Box
                style={{
                  width: width - 32,
                  height: 60,
                  borderRadius: 8,
                  backgroundColor: theme.colors.surfaceVariant,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  text="↓ Pull down to refresh"
                  style={{ fontSize: 14, color: theme.colors.textSecondary }}
                />
              </Box>
            </RefreshIndicator>
          </Box>

          <Box style={{ height: 80 }} />
        </Column>
      </ScrollView>

      {/* ── Overlays — always at root level ── */}
      <SnackBar
        visible={snackVisible}
        message={snackMsg}
        duration={3000}
        screenWidth={width}
        screenHeight={height}
        action={
          snackHasAction
            ? { label: 'HOÀN TÁC', onPress: () => setSnackVisible(false) }
            : undefined
        }
        onDismiss={() => setSnackVisible(false)}
      />

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        screenWidth={width}
        screenHeight={height}
        style={{ width: width - 64, height: 180 }}
      >
        <Column style={{ padding: 20, gap: 12 }}>
          <Text
            text="Thông báo"
            style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textBody }}
          />
          <Text
            text="Đây là Modal component với backdrop. Tap ngoài để đóng."
            style={{ fontSize: 14, color: theme.colors.textSecondary }}
          />
          <Row style={{ gap: 8, justifyContent: 'flex-end' }}>
            <Button
              text="Đóng"
              variant="solid"
              color="primary"
              interactive="opacity"
              onPress={() => setModalVisible(false)}
            />
          </Row>
        </Column>
      </Modal>

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        screenWidth={width}
        screenHeight={height}
        style={{ height: 240 }}
      >
        <Column style={{ gap: 12, padding: 16 }}>
          <Text
            text="BottomSheet"
            style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textBody }}
          />
          <Text
            text="BottomSheet slides up từ dưới màn hình. Tap overlay để đóng."
            style={{ fontSize: 14, color: theme.colors.textBody }}
          />
          <Button
            text="Close"
            variant="solid"
            color="primary"
            onPress={() => setSheetVisible(false)}
          />
        </Column>
      </BottomSheet>
    </Box>
  );
}
