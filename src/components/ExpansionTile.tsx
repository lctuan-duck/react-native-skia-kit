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

export interface ExpansionTileProps extends WidgetProps {
  /** Header title — REQUIRED */
  title: string;
  /** Subtitle */
  subtitle?: string;
  /** Leading widget (icon/avatar) */
  leading?: React.ReactNode;
  /** Expandable content — REQUIRED */
  children: React.ReactNode;
  /** Initially expanded */
  initiallyExpanded?: boolean;
  /** Expansion state callback */
  onExpansionChanged?: (expanded: boolean) => void;
  /** Background when expanded */
  backgroundColor?: string;
  /** Background when collapsed */
  collapsedBackgroundColor?: string;
  /** Chevron icon color */
  iconColor?: string;
  /** Header padding */
  tilePadding?: number;
  /** Content padding */
  childrenPadding?: number;
}

/**
 * ExpansionTile — accordion collapse/expand.
 * Tương đương Flutter ExpansionTile / ExpansionPanel.
 */
export const ExpansionTile = React.memo(function ExpansionTile({
  x = 0,
  y = 0,
  width = 360,
  title,
  subtitle,
  leading,
  children,
  initiallyExpanded = false,
  onExpansionChanged,
  backgroundColor,
  collapsedBackgroundColor,
  iconColor,
  tilePadding = 16,
  childrenPadding = 16,
}: ExpansionTileProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const chevronColor = iconColor ?? theme.colors.textSecondary;

  useWidget({
    type: 'ExpansionTile',
    layout: { x, y, width, height: expanded ? 200 : subtitle ? 72 : 56 },
  });

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onExpansionChanged?.(next);
  };

  const bgColor = expanded
    ? backgroundColor ?? 'transparent'
    : collapsedBackgroundColor ?? 'transparent';

  return (
    <Column x={x} y={y}>
      {/* Header — always visible */}
      <Box
        width={width}
        height={subtitle ? 72 : 56}
        color={bgColor}
        flexDirection="row"
        alignItems="center"
        padding={[0, tilePadding, 0, tilePadding]}
        gap={16}
        hitTestBehavior="opaque"
        onPress={toggle}
      >
        {leading}
        <Expanded>
          <Column gap={2}>
            <Text text={title} fontSize={16} color={theme.colors.textBody} />
            {subtitle && (
              <Text
                text={subtitle}
                fontSize={14}
                color={theme.colors.textSecondary}
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

      {/* Content — shown when expanded */}
      {expanded && (
        <Box width={width} padding={childrenPadding} color={bgColor}>
          {children}
        </Box>
      )}
    </Column>
  );
});
