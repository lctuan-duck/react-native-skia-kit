import * as React from 'react';
import { useCallback } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Divider } from './Divider';
import { Overlay } from './Overlay';
import { useOverlayStore } from '../stores/overlayStore';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

export interface PopupMenuItem<T = string> {
  value: T;
  label: string;
  icon?: string;
  enabled?: boolean;
  divider?: boolean;
}

export interface PopupMenuButtonProps<T = string> extends WidgetProps {
  /** Menu items — REQUIRED */
  items: PopupMenuItem<T>[];
  /** Selection callback */
  onSelected?: (value: T) => void;
  /** Custom trigger widget */
  child?: React.ReactNode;
  /** Trigger icon name */
  icon?: string;
  /** Menu width */
  menuWidth?: number;
  /** Menu elevation */
  menuElevation?: number;
  /** Menu background */
  menuColor?: string;
  /** Menu border radius */
  menuBorderRadius?: number;
  /** Position offset */
  offset?: { dx: number; dy: number };
  /** Screen width for backdrop */
  screenWidth?: number;
  /** Screen height for backdrop */
  screenHeight?: number;
}

/**
 * PopupMenuButton — shows a popup menu of items on press.
 * Uses overlayStore to render above other UI.
 *
 * Tương đương Flutter PopupMenuButton.
 */
export const PopupMenuButton = React.memo(function PopupMenuButton<
  T extends string
>({
  x = 0,
  y = 0,
  items,
  onSelected,
  child,
  icon = 'more',
  menuWidth = 200,
  menuElevation = 8,
  menuColor,
  menuBorderRadius = 8,
  offset = { dx: 0, dy: 0 },
  screenWidth = 360,
  screenHeight = 800,
}: PopupMenuButtonProps<T>) {
  const theme = useTheme();
  const bgColor = menuColor ?? theme.colors.surface;
  const showOverlay = useOverlayStore((s) => s.showOverlay);
  const hideOverlay = useOverlayStore((s) => s.hideOverlay);
  const menuId = `popup-menu-${x}-${y}`;

  useWidget({
    type: 'PopupMenuButton',
    layout: { x, y, width: 40, height: 40 },
  });

  const openMenu = useCallback(() => {
    const menuX = x + offset.dx;
    const menuY = y + 40 + offset.dy;

    showOverlay(
      menuId,
      <>
        {/* Backdrop */}
        <Overlay
          visible
          barrierColor="transparent"
          onPress={() => hideOverlay(menuId)}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
        />
        {/* Menu */}
        <Box
          x={menuX}
          y={menuY}
          style={{
            width: menuWidth,
            borderRadius: menuBorderRadius,
            backgroundColor: bgColor,
            elevation: menuElevation,
            flexDirection: 'column',
          }}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <Box
                style={{
                  width: menuWidth,
                  height: 44,
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: [0, 16, 0, 16],
                  gap: 12,
                  opacity: item.enabled === false ? 0.5 : 1,
                }}
                hitTestBehavior="opaque"
                onPress={() => {
                  if (item.enabled !== false) {
                    hideOverlay(menuId);
                    onSelected?.(item.value);
                  }
                }}
              >
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                )}
                <Text
                  text={item.label}
                  style={{
                    fontSize: 14,
                    color: theme.colors.textBody,
                  }}
                />
              </Box>
              {item.divider && <Divider style={{ length: menuWidth - 32 }} />}
            </React.Fragment>
          ))}
        </Box>
      </>,
      200
    );
  }, [
    items,
    onSelected,
    menuId,
    x,
    y,
    offset,
    menuWidth,
    menuBorderRadius,
    bgColor,
    menuElevation,
    theme,
    showOverlay,
    hideOverlay,
    screenWidth,
    screenHeight,
  ]);

  return (
    <Box
      x={x}
      y={y}
      style={{
        width: 40,
        height: 40,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      hitTestBehavior="opaque"
      onPress={openMenu}
    >
      {child ?? <Icon name={icon} size={24} color={theme.colors.textBody} />}
    </Box>
  );
}) as <T extends string>(
  props: PopupMenuButtonProps<T> & { ref?: React.Ref<any> }
) => React.ReactElement | null;
