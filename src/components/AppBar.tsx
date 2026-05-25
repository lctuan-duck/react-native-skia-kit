import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Button } from './Button';
import { Row } from './Row';
import { Expanded } from './Expanded';
import { useWidgetId } from '../hooks/useWidgetId';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { useNav } from '../hooks/useNav';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  ShadowStyle,
  FlexChildStyle,
} from '../types/style.types';

// === AppBar Types ===

export type AppBarStyle = ColorStyle &
  ShadowStyle &
  FlexChildStyle & {
    foregroundColor?: string;
    width?: number | string;
    height?: number | string;
  };

export interface AppBarProps extends WidgetProps {
  title?: string;
  titleWidget?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode[];
  centerTitle?: boolean;
  /** Style override */
  style?: AppBarStyle;
  onBack?: () => void;
}

export const AppBar = React.memo(function AppBar({
  title,
  titleWidget,
  leading,
  actions,
  centerTitle = false,
  style,
  onBack,
}: AppBarProps) {
  const theme = useTheme();
  const nav = useNav();
  const bgColor = style?.backgroundColor ?? theme.colors.primary;
  const fgColor = style?.foregroundColor ?? theme.colors.onPrimary;
  const elev = style?.elevation ?? 4;
  const width = style?.width ?? '100%';
  const height = style?.height ?? 56;

  const widgetId = useWidgetId('AppBar');

  const layoutResult = useNativeYogaLayout(
    widgetId,
    { ...style, width, height },
    undefined
  );

  const finalX = layoutResult?.x ?? 0;
  const finalY = layoutResult?.y ?? 0;

  const leadingWidget =
    leading ??
    (onBack || nav.canGoBack() ? (
      <Button
        variant="icon"
        icon="arrow-left"
        style={{ iconSize: 24, tapSize: 40, backgroundColor: 'transparent' }}
        onPress={() => (onBack ? onBack() : nav.pop())}
      />
    ) : null);

  return (
    <Box
      x={finalX}
      y={finalY}
      style={{
        width,
        height,
        backgroundColor: bgColor,
        elevation: elev,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      {leadingWidget}
      <Expanded>
        {titleWidget ?? (
          <Text
            text={title ?? ''}
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: fgColor,
              textAlign: centerTitle ? 'center' : 'left',
            }}
          />
        )}
      </Expanded>
      {actions && (
        <Row style={{ gap: 4 }}>
          {actions.map((action, i) => (
            <React.Fragment key={i}>{action}</React.Fragment>
          ))}
        </Row>
      )}
    </Box>
  );
});

(AppBar as any).skiaWidgetType = 'AppBar';
