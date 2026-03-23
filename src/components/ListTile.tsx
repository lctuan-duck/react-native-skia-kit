import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Column } from './Column';
import { Expanded } from './Expanded';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface ListTileProps extends WidgetProps {
  /** Title text — REQUIRED */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Leading widget (Icon/Avatar at left) */
  leading?: React.ReactNode;
  /** Trailing widget (Switch/Checkbox/Icon at right) */
  trailing?: React.ReactNode;
  /** Title text color */
  titleColor?: string;
  /** Subtitle text color */
  subtitleColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Content padding */
  contentPadding?: number;
  /** Dense/compact mode (height: 48) */
  dense?: boolean;
  /** Press callback */
  onPress?: () => void;
  /** Long press callback */
  onLongPress?: () => void;
}

/**
 * ListTile — leading + title/subtitle + trailing list item.
 * Tương đương Flutter ListTile.
 *
 * Composition: Box (row flex) + leading + Column (title/subtitle) + Expanded + trailing.
 */
export const ListTile = React.memo(function ListTile({
  x = 0,
  y = 0,
  width,
  height,
  title,
  subtitle,
  leading,
  trailing,
  titleColor,
  subtitleColor,
  backgroundColor,
  contentPadding = 16,
  dense = false,
  onPress,
  onLongPress,
}: ListTileProps) {
  const theme = useTheme();
  const fgTitle = titleColor ?? theme.colors.textBody;
  const fgSubtitle = subtitleColor ?? theme.colors.textSecondary;
  const bgColor = backgroundColor ?? 'transparent';

  // Auto height: dense=48, subtitle=72, default=56
  const tileHeight = height ?? (dense ? 48 : subtitle ? 72 : 56);

  const w = width ?? 0;

  useWidget({
    type: 'ListTile',
    layout: { x, y, width: w, height: tileHeight },
  });

  return (
    <Box
      x={x}
      y={y}
      width={width}
      height={tileHeight}
      color={bgColor}
      flexDirection="row"
      alignItems="center"
      padding={[0, contentPadding, 0, contentPadding]}
      gap={16}
      hitTestBehavior="opaque"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Leading — Icon/Avatar */}
      {leading}

      {/* Content — Title + Subtitle */}
      <Expanded>
        <Column gap={2} mainAxisAlignment="center">
          <Text text={title} fontSize={dense ? 14 : 16} color={fgTitle} />
          {subtitle && (
            <Text
              text={subtitle}
              fontSize={dense ? 12 : 14}
              color={fgSubtitle}
            />
          )}
        </Column>
      </Expanded>

      {/* Trailing — Switch/Checkbox/Icon */}
      {trailing}
    </Box>
  );
});
