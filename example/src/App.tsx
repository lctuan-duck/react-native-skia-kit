import { useWindowDimensions } from 'react-native';
import { CanvasRoot, Box, Text, useTheme } from 'react-native-skia-kit';

function DemoContent() {
  const theme = useTheme();

  return (
    <>
      {/* Background */}
      <Box
        x={0}
        y={0}
        width={360}
        height={800}
        color={theme.colors.background}
      />

      {/* Header */}
      <Box x={0} y={0} width={360} height={56} color={theme.colors.primary}>
        <Text
          x={16}
          y={18}
          text="React Native Skia Kit"
          fontSize={20}
          fontWeight="bold"
          color={theme.colors.onPrimary}
        />
      </Box>

      {/* Card */}
      <Box
        x={16}
        y={72}
        width={328}
        height={120}
        color={theme.colors.surface}
        borderRadius={12}
        elevation={4}
      >
        <Text
          x={32}
          y={88}
          text="Hello Skia Kit! 🚀"
          fontSize={18}
          fontWeight="600"
          color={theme.colors.textBody}
        />
        <Text
          x={32}
          y={114}
          text="Flutter-like UI rendered on Skia Canvas"
          fontSize={14}
          color={theme.colors.textSecondary}
        />
        <Text
          x={32}
          y={140}
          text="Box + Text + Theme working!"
          fontSize={14}
          color={theme.colors.success}
        />
      </Box>

      {/* Color palette demo */}
      <Text
        x={16}
        y={212}
        text="Theme Colors"
        fontSize={16}
        fontWeight="bold"
      />
      <Box
        x={16}
        y={236}
        width={70}
        height={40}
        borderRadius={8}
        color={theme.colors.primary}
      />
      <Box
        x={94}
        y={236}
        width={70}
        height={40}
        borderRadius={8}
        color={theme.colors.secondary}
      />
      <Box
        x={172}
        y={236}
        width={70}
        height={40}
        borderRadius={8}
        color={theme.colors.tertiary}
      />
      <Box
        x={250}
        y={236}
        width={70}
        height={40}
        borderRadius={8}
        color={theme.colors.success}
      />

      <Box
        x={16}
        y={284}
        width={70}
        height={40}
        borderRadius={8}
        color={theme.colors.error}
      />
      <Box
        x={94}
        y={284}
        width={70}
        height={40}
        borderRadius={8}
        color={theme.colors.warning}
      />
      <Box
        x={172}
        y={284}
        width={70}
        height={40}
        borderRadius={8}
        color={theme.colors.info}
      />
      <Box
        x={250}
        y={284}
        width={70}
        height={40}
        borderRadius={8}
        color={theme.colors.surfaceVariant}
      />
    </>
  );
}

export default function App() {
  const { width, height } = useWindowDimensions();

  return (
    <CanvasRoot style={{ width, height }}>
      <DemoContent />
    </CanvasRoot>
  );
}
