import * as React from 'react';
import { Group } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';

// ===== Overlay =====

export interface OverlayProps extends WidgetProps {
  visible?: boolean;
  onPress?: () => void;
  color?: string;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Overlay — transparent/semi-transparent backdrop.
 * Used by Modal, BottomSheet, Drawer, PopupMenu to catch dismiss taps.
 * hitTestBehavior = 'translucent' → allows layers above (Modal/Drawer) to also receive events.
 */
export const Overlay = React.memo(function Overlay({
  visible = false,
  onPress,
  color = 'rgba(0,0,0,0.5)',
  screenWidth = 360,
  screenHeight = 800,
}: OverlayProps) {
  // Only register widget when visible to avoid polluting widget tree
  useWidget({
    type: 'Overlay',
    layout: {
      x: 0,
      y: 0,
      width: visible ? screenWidth : 0,
      height: visible ? screenHeight : 0,
    },
  });

  if (!visible) return null;
  return (
    <Box
      x={0}
      y={0}
      width={screenWidth}
      height={screenHeight}
      color={color}
      hitTestBehavior="translucent"
      onPress={onPress}
    />
  );
});

// ===== Modal =====

export interface ModalProps extends WidgetProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  barrierDismissible?: boolean;
  barrierColor?: string;
  borderRadius?: number;
  backgroundColor?: string;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Modal — centered dialog overlay.
 * Composition: Overlay (barrier) + Box (dialog).
 * Tương đương Flutter showDialog / AlertDialog.
 */
export const Modal = React.memo(function Modal({
  visible = false,
  onClose,
  children,
  barrierDismissible = true,
  barrierColor = 'rgba(0,0,0,0.5)',
  borderRadius = 16,
  backgroundColor,
  width = 280,
  height = 200,
  screenWidth = 360,
  screenHeight = 800,
}: ModalProps) {
  const theme = useTheme();
  if (!visible) return null;
  const bgColor = backgroundColor ?? theme.colors.surface;
  const modalX = (screenWidth - (width ?? 280)) / 2;
  const modalY = (screenHeight - (height ?? 200)) / 2;

  return (
    <Group>
      <Overlay
        visible
        color={barrierColor}
        onPress={barrierDismissible ? onClose : undefined}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
      <Box
        x={modalX}
        y={modalY}
        width={width}
        height={height}
        borderRadius={borderRadius}
        color={bgColor}
        elevation={24}
        hitTestBehavior="opaque"
      >
        {children}
      </Box>
    </Group>
  );
});

// ===== BottomSheet =====

export interface BottomSheetProps extends WidgetProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  sheetHeight?: number;
  borderRadius?: number;
  backgroundColor?: string;
  barrierColor?: string;
  showHandle?: boolean;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * BottomSheet — slides up from bottom.
 * Composition: Overlay (barrier) + Box (sheet with handle).
 * Tương đương Flutter showModalBottomSheet.
 */
export const BottomSheet = React.memo(function BottomSheet({
  visible = false,
  onClose,
  children,
  sheetHeight = 400,
  borderRadius = 24,
  backgroundColor,
  barrierColor = 'rgba(0,0,0,0.5)',
  showHandle = true,
  screenWidth = 360,
  screenHeight = 800,
}: BottomSheetProps) {
  const theme = useTheme();
  if (!visible) return null;
  const bgColor = backgroundColor ?? theme.colors.surface;

  return (
    <Group>
      <Overlay
        visible
        color={barrierColor}
        onPress={onClose}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
      <Box
        x={0}
        y={screenHeight - sheetHeight}
        width={screenWidth}
        height={sheetHeight}
        borderRadius={borderRadius}
        color={bgColor}
        elevation={16}
        flexDirection="column"
        alignItems="center"
      >
        {showHandle && (
          <Box
            width={40}
            height={4}
            borderRadius={2}
            color={theme.colors.textDisabled}
          />
        )}
        {children}
      </Box>
    </Group>
  );
});

// ===== Drawer =====

export interface DrawerProps extends WidgetProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  drawerWidth?: number;
  side?: 'left' | 'right';
  backgroundColor?: string;
  barrierColor?: string;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Drawer — side panel overlay.
 * Tương đương Flutter Drawer.
 */
export const Drawer = React.memo(function Drawer({
  visible = false,
  onClose,
  children,
  drawerWidth = 280,
  side = 'left',
  backgroundColor,
  barrierColor = 'rgba(0,0,0,0.5)',
  screenWidth = 360,
  screenHeight = 800,
}: DrawerProps) {
  const theme = useTheme();
  if (!visible) return null;
  const bgColor = backgroundColor ?? theme.colors.surface;
  const drawerX = side === 'left' ? 0 : screenWidth - drawerWidth;

  return (
    <Group>
      <Overlay
        visible
        color={barrierColor}
        onPress={onClose}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
      <Box
        x={drawerX}
        y={0}
        width={drawerWidth}
        height={screenHeight}
        color={bgColor}
        elevation={16}
        hitTestBehavior="opaque"
      >
        {children}
      </Box>
    </Group>
  );
});
