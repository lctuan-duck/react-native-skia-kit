import * as React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Column } from './Column';
import { Expanded } from './Expanded';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  SpacingStyle,
  FlexChildStyle,
} from '../types/style.types';

// === ListTile Types ===

export type ListTileStyle = ColorStyle &
  SpacingStyle &
  FlexChildStyle & {
    titleColor?: string;
    subtitleColor?: string;
    width?: number;
    height?: number;
  };

export interface ListTileProps extends WidgetProps {
  /** Title text — REQUIRED */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Leading widget (Icon/Avatar at left) */
  leading?: React.ReactNode;
  /** Trailing widget (Switch/Checkbox/Icon at right) */
  trailing?: React.ReactNode;
  /** Dense/compact mode (height: 48) */
  dense?: boolean;
  /** Style override */
  style?: ListTileStyle;
  /** Interactive effect (Default: ripple) */
  interactive?: 'ripple' | 'bounce' | 'opacity' | 'none';
  /** Press callback */
  onPress?: (localX?: number, localY?: number) => void;
  /** Long press callback */
  onLongPress?: () => void;
}

/**
 * ListTile — leading + title/subtitle + trailing list item.
 * Tương đương Flutter ListTile.
 */
export const ListTile = React.memo(function ListTile({
  title,
  subtitle,
  leading,
  trailing,
  dense = false,
  interactive,
  style,
  onPress,
  onLongPress,
}: ListTileProps) {
  const theme = useTheme();
  const fgTitle = style?.titleColor ?? theme.colors.textBody;
  const fgSubtitle = style?.subtitleColor ?? theme.colors.textSecondary;
  const bgColor = style?.backgroundColor ?? 'transparent';
  const contentPadding = 16;

  const width = style?.width;
  const tileHeight = style?.height ?? (dense ? 48 : subtitle ? 72 : 56);

  const w = width ?? 0;

  useWidgetId('ListTile');

  return (
    <Box
      style={{
        width,
        height: tileHeight,
        backgroundColor: bgColor,
        flexDirection: 'row',
        alignItems: 'center',
        padding: [0, contentPadding, 0, contentPadding],
        gap: 16,
        ...style,
      }}
      hitTestBehavior="opaque"
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {leading}

      <Expanded>
        <Column mainAxisAlignment="center" style={{ gap: 2 }}>
          <Text
            text={title}
            style={{
              fontSize: dense ? 14 : 16,
              color: fgTitle,
            }}
          />
          {subtitle && (
            <Text
              text={subtitle}
              style={{
                fontSize: dense ? 12 : 14,
                color: fgSubtitle,
              }}
            />
          )}
        </Column>
      </Expanded>

      {trailing}
    </Box>
  );
});

(ListTile as any).skiaWidgetType = 'ListTile';
