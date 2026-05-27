/**
 * SectionHeader — tiêu đề phân section trong tab.
 */
import { Box, Text } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit';

interface Props {
  title: string;
}

export function SectionHeader({ title }: Props) {
  const theme = useTheme();
  return (
    <Box
      style={{
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 20,
        paddingBottom: 8,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        text={title.toUpperCase()}
        style={{
          fontSize: 11,
          fontWeight: 'bold',
          color: theme.colors.primary,
        }}
      />
    </Box>
  );
}
