import * as React from 'react';
import { useState } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Column } from './Column';
import { Expanded } from './Expanded';
import { useTheme } from '../hooks/useTheme';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../core/types';
import type { ColorStyle, FlexChildStyle } from '../core/style.types';

// === ExpansionTile Types ===

export type ExpansionTileStyle = ColorStyle &
  FlexChildStyle & {
    collapsedBackgroundColor?: string;
    iconColor?: string;
    tilePadding?: number;
    childrenPadding?: number;
    width?: number;
  };

export interface ExpansionTileProps extends WidgetProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  onExpansionChanged?: (expanded: boolean) => void;
  /** Style override */
  style?: ExpansionTileStyle;
}

export const ExpansionTile = React.memo(function ExpansionTile({
  x = 0,
  y = 0,
  title,
  subtitle,
  leading,
  children,
  initiallyExpanded = false,
  onExpansionChanged,
  style,
}: ExpansionTileProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const chevronColor = style?.iconColor ?? theme.colors.textSecondary;
  const tilePadding = style?.tilePadding ?? 16;
  const childrenPadding = style?.childrenPadding ?? 16;
  const width = style?.width;
  const w = width ?? 0;

  useWidget({
    type: 'ExpansionTile',
    layout: { x, y, width: w, height: expanded ? 200 : subtitle ? 72 : 56 },
  });

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onExpansionChanged?.(next);
  };

  const bgColor = expanded
    ? (style?.backgroundColor ?? 'transparent')
    : (style?.collapsedBackgroundColor ?? 'transparent');

  return (
    <Column x={x} y={y}>
      <Box
        style={{
          width,
          height: subtitle ? 72 : 56,
          backgroundColor: bgColor,
          flexDirection: 'row',
          alignItems: 'center',
          padding: [0, tilePadding, 0, tilePadding],
          gap: 16,
        }}
        hitTestBehavior="opaque"
        onPress={toggle}
      >
        {leading}
        <Expanded>
          <Column style={{ gap: 2 }}>
            <Text
              text={title}
              style={{ fontSize: 16, color: theme.colors.textBody }}
            />
            {subtitle && (
              <Text
                text={subtitle}
                style={{ fontSize: 14, color: theme.colors.textSecondary }}
              />
            )}
          </Column>
        </Expanded>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={chevronColor}
        />
      </Box>

      {expanded && (
        <Box
          style={{
            width,
            padding: childrenPadding,
            backgroundColor: bgColor,
          }}
        >
          {children}
        </Box>
      )}
    </Column>
  );
});
