import React, { useState } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Column } from './Column';
import { Expanded } from './Expanded';
import { useTheme } from '../hooks/useTheme';
import { useWidgetId } from '../hooks/useWidgetId';
import { useEngine } from '../core/EngineContext';
import type { WidgetProps } from '../types/widget.types';
import type { ColorStyle, FlexChildStyle } from '../types/style.types';

// === ExpansionTile Types ===

export type ExpansionTileStyle = ColorStyle &
  FlexChildStyle & {
    collapsedBackgroundColor?: string;
    iconColor?: string;
    tilePadding?: number;
    childrenPadding?: number;
    width?: number | string;
    /** Max height of expanded content area (default: 400) */
    expandedMaxHeight?: number;
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

// ── JS-thread bridge for animated panel height ───────────────────────────────
const applyPanelHeight = (panelId: string, h: number) => {
    engine.updateAnimatedStyles(panelId, { height: h, opacity: h > 4 ? 1 : 0 });
  (global as any).skiaKitScrollRedraw?.();
};

export const ExpansionTile = React.memo(function ExpansionTile({
  title,
  subtitle,
  leading,
  children,
  initiallyExpanded = false,
  onExpansionChanged,
  style,
}: {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  onExpansionChanged?: (expanded: boolean) => void;
  style?: ExpansionTileStyle;
}) {
  const theme = useTheme();
  const engine = useEngine();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  // Track whether children should be in the tree (keep mounted during exit animation)
  const [contentMounted, setContentMounted] = useState(initiallyExpanded);

  const chevronWidgetId = useWidgetId('ET-chevron');
  const panelWidgetId = useWidgetId('ET-panel');

  const chevronRotation = useSharedValue(initiallyExpanded ? 1 : 0);

  // ET1 fix: Animate chevron rotation via C++ updateAnimatedStyles
  useAnimatedReaction(
    () => chevronRotation.value,
    (r) => {
      'worklet';
      // Map 0→0°, 1→180° rotation
        const angleDeg = r * 180;
        const direct = (global as any).updateAnimatedStylesDirect;
        if (typeof direct === 'function') {
          direct(chevronWidgetId, { rotateZ: angleDeg });
        } else {
          scheduleOnRN(
            (id: string, rot: number) => {
              engine.updateAnimatedStyles(id, { rotateZ: rot });
              (global as any).skiaKitScrollRedraw?.();
            },
            chevronWidgetId,
            angleDeg
          );
        }
    },
    [chevronWidgetId]
  );

  const expandedMaxHeight = style?.expandedMaxHeight ?? 400;
  const chevronColor = style?.iconColor ?? theme.colors.textSecondary;
  const tilePadding = style?.tilePadding ?? 16;
  const childrenPadding = style?.childrenPadding ?? 16;
  const width = style?.width ?? '100%';

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onExpansionChanged?.(next);

    if (next) {
      // Expanding: mount content first, then animate chevron and trigger layout pass
      setContentMounted(true);
      chevronRotation.value = withTiming(1, { duration: 250 });
    } else {
      // Collapsing: animate chevron and trigger layout pass
      chevronRotation.value = withTiming(0, { duration: 250 });
      // Unmount after C++ layout transition finishes (250ms)
      setTimeout(() => setContentMounted(false), 260);
    }
  };

  const bgColor = expanded
    ? style?.backgroundColor ?? 'transparent'
    : style?.collapsedBackgroundColor ?? 'transparent';

  return (
    <Column>
      {/* ── Tile header row ── */}
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
        {/* ET2 fix: chevron animates via C++ rotation — icon itself is always chevron-down,
            rotation is driven by updateAnimatedStyles(rotation) */}
        <Box id={chevronWidgetId}>
          <Icon name="chevron-down" size={20} color={chevronColor} />
        </Box>
      </Box>

      {/* ── Animated content panel ── */}
      {contentMounted && (
        <Box
          id={panelWidgetId}
          style={{
            width,
            // Native C++ Layout Transitions will animate this change over 250ms automatically
            height: expanded ? undefined : 0,
            opacity: expanded ? 1 : 0,
            overflow: 'hidden',
            padding: expanded ? childrenPadding : 0,
            backgroundColor: bgColor,
          }}
        >
          {children}
        </Box>
      )}
    </Column>
  );
});

(ExpansionTile as any).skiaWidgetType = 'ExpansionTile';