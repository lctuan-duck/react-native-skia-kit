import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Button } from './Button';
import { Row } from './Row';
import { Expanded } from './Expanded';
import { useWidget } from '../hooks/useWidget';
import { useNav } from '../hooks/useNav';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface AppBarProps extends WidgetProps {
  title?: string;
  titleWidget?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode[];
  backgroundColor?: string;
  foregroundColor?: string;
  elevation?: number;
  centerTitle?: boolean;
  onBack?: () => void;
}

export const AppBar = React.memo(function AppBar({
  x = 0,
  y = 0,
  width = 360,
  height = 56,
  title,
  titleWidget,
  leading,
  actions,
  backgroundColor,
  foregroundColor,
  elevation = 4,
  centerTitle = false,
  onBack,
}: AppBarProps) {
  const theme = useTheme();
  const nav = useNav();
  const bgColor = backgroundColor ?? theme.colors.primary;
  const fgColor = foregroundColor ?? theme.colors.onPrimary;

  useWidget({ type: 'AppBar', layout: { x, y, width, height } });

  const leadingWidget =
    leading ??
    (onBack || nav.canGoBack() ? (
      <Button
        variant="icon"
        icon="arrow-left"
        iconSize={24}
        tapSize={40}
        color={fgColor}
        onPress={() => (onBack ? onBack() : nav.pop())}
      />
    ) : null);

  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={height}
      color={bgColor}
      elevation={elevation}
      flexDirection="row"
      alignItems="center"
      padding={[0, 8, 0, 8]}
    >
      {leadingWidget}
      <Expanded>
        {titleWidget ?? (
          <Text
            text={title ?? ''}
            fontSize={20}
            fontWeight="bold"
            color={fgColor}
            textAlign={centerTitle ? 'center' : 'left'}
          />
        )}
      </Expanded>
      {actions && (
        <Row gap={4}>
          {actions.map((action, i) => (
            <React.Fragment key={i}>{action}</React.Fragment>
          ))}
        </Row>
      )}
    </Box>
  );
});
