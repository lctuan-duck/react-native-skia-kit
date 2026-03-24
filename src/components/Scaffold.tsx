import * as React from 'react';
import { Group } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type { ColorStyle, FlexChildStyle } from '../types/style.types';

// === Scaffold Types ===

export type ScaffoldStyle = ColorStyle &
  FlexChildStyle & {
    width?: number;
    height?: number;
  };

export interface ScaffoldProps extends WidgetProps {
  appBar?: React.ReactNode;
  body: React.ReactNode;
  bottomNavigationBar?: React.ReactNode;
  floatingActionButton?: React.ReactNode;
  drawer?: React.ReactNode;
  fabPosition?: 'bottomRight' | 'bottomCenter' | 'bottomLeft';
  /** Style override */
  style?: ScaffoldStyle;
}

export const Scaffold = React.memo(function Scaffold({
  style,
  appBar,
  body,
  bottomNavigationBar,
  floatingActionButton,
  drawer,
  fabPosition = 'bottomRight',
}: ScaffoldProps) {
  const theme = useTheme();
  const bgColor = style?.backgroundColor ?? theme.colors.background;
  const width = style?.width ?? 360;
  const height = style?.height ?? 800;

  useWidget({ type: 'Scaffold', layout: { x: 0, y: 0, width, height } });

  const appBarHeight = appBar ? 56 : 0;
  const bottomNavHeight = bottomNavigationBar ? 64 : 0;
  const bodyY = appBarHeight;
  const bodyHeight = height - appBarHeight - bottomNavHeight;

  const fabPositions = {
    bottomRight: { x: width - 72, y: height - bottomNavHeight - 72 },
    bottomCenter: { x: width / 2 - 28, y: height - bottomNavHeight - 72 },
    bottomLeft: { x: 16, y: height - bottomNavHeight - 72 },
  };
  const fabPos = fabPositions[fabPosition];

  return (
    <Group>
      <Box x={0} y={0} style={{ width, height, backgroundColor: bgColor }} />
      {appBar && (
        <Group>
          {React.cloneElement(appBar as React.ReactElement<WidgetProps>, {
            x: 0,
            y: 0,
          })}
        </Group>
      )}
      <Group clip={{ x: 0, y: bodyY, width, height: bodyHeight }}>{body}</Group>
      {bottomNavigationBar && (
        <Group>
          {React.cloneElement(
            bottomNavigationBar as React.ReactElement<WidgetProps>,
            { x: 0, y: height - bottomNavHeight }
          )}
        </Group>
      )}
      {floatingActionButton && (
        <Group>
          {React.cloneElement(
            floatingActionButton as React.ReactElement<WidgetProps>,
            { x: fabPos.x, y: fabPos.y }
          )}
        </Group>
      )}
      {drawer}
    </Group>
  );
});
