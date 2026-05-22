import * as React from 'react';
import { Box } from './Box';
import { Expanded } from './Expanded';
import { useWidgetId } from '../hooks/useWidgetId';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { useTheme } from '../hooks/useTheme';
import { useWindowDimensions } from 'react-native';
import type { WidgetProps } from '../types/widget.types';
import type { ColorStyle, FlexChildStyle } from '../types/style.types';

// === Scaffold Types ===

export type ScaffoldStyle = ColorStyle &
  FlexChildStyle & {
    width?: number | string;
    height?: number | string;
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
  useWindowDimensions(); // Trigger re-render on screen size change
  const bgColor = style?.backgroundColor ?? theme.colors.background;

  const width = style?.width ?? '100%';
  const height = style?.height ?? '100%';

  const widgetId = useWidgetId('Scaffold');

  const layoutResult = useNativeYogaLayout(
    widgetId,
    { ...style, width, height },
    undefined
  );

  const finalX = layoutResult?.x ?? 0;
  const finalY = layoutResult?.y ?? 0;

  
  // Resolve FAB positioning
  // Using absolute positioning inside Yoga layout
  const bottomNavGap = bottomNavigationBar ? 64 : 0;
  
  const fabStyle: any = {
    position: 'absolute',
    bottom: bottomNavGap + 16,
    zIndex: 10, // Ensure FAB sits on top
  };
  
  if (fabPosition === 'bottomRight') {
    fabStyle.right = 16;
  } else if (fabPosition === 'bottomLeft') {
    fabStyle.left = 16;
  } else {
    // bottomCenter - manual centering since Yoga absolute positioning alignSelf isn't perfect for this
    fabStyle.alignSelf = 'center';
  }

  return (
    <Box
      x={finalX}
      y={finalY}
      style={{
        width,
        height,
        backgroundColor: bgColor,
        flexDirection: 'column',
      }}
    >
      {appBar}
      
      <Expanded>
        <Box style={{ flex: 1, overflow: 'hidden' }}>
          {body}
        </Box>
      </Expanded>

      {bottomNavigationBar}

      {floatingActionButton && (
        <Box style={fabStyle}>
          {floatingActionButton}
        </Box>
      )}

      {drawer}
    </Box>
  );
});

(Scaffold as any).skiaWidgetType = 'Scaffold';
