import * as React from 'react';
import { Group } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useTheme } from '../hooks/useTheme';
import type { WidgetProps } from '../core/types';
import type {
  ColorStyle,
  BorderStyle,
  ShadowStyle,
  FlexChildStyle,
} from '../core/style.types';

// ===== Overlay =====

export interface OverlayProps extends WidgetProps {
  visible?: boolean;
  onPress?: () => void;
  /** Barrier color (accepts rgba string for semi-transparent backdrops) */
  barrierColor?: string;
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
  barrierColor = 'rgba(0,0,0,0.5)',
  screenWidth = 360,
  screenHeight = 800,
}: OverlayProps) {
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
      style={{
        width: screenWidth,
        height: screenHeight,
        backgroundColor: barrierColor,
      }}
      hitTestBehavior="translucent"
      onPress={onPress}
    />
  );
});

// ===== Modal =====

export type ModalStyle = ColorStyle &
  BorderStyle &
  ShadowStyle &
  FlexChildStyle & {
    width?: number;
    height?: number;
  };

export interface ModalProps extends WidgetProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  barrierDismissible?: boolean;
  barrierColor?: string;
  /** Style override (width, height, borderRadius, backgroundColor, elevation) */
  style?: ModalStyle;
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
  style,
  screenWidth = 360,
  screenHeight = 800,
}: ModalProps) {
  const theme = useTheme();
  if (!visible) return null;

  const w = style?.width ?? 280;
  const h = style?.height ?? 200;
  const bgColor = style?.backgroundColor ?? theme.colors.surface;
  const borderR = style?.borderRadius ?? 16;
  const elev = style?.elevation ?? 24;
  const modalX = (screenWidth - w) / 2;
  const modalY = (screenHeight - h) / 2;

  return (
    <Group>
      <Overlay
        visible
        barrierColor={barrierColor}
        onPress={barrierDismissible ? onClose : undefined}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
      <Box
        x={modalX}
        y={modalY}
        style={{
          width: w,
          height: h,
          borderRadius: borderR,
          backgroundColor: bgColor,
          elevation: elev,
        }}
        hitTestBehavior="opaque"
      >
        {children}
      </Box>
    </Group>
  );
});

// ===== BottomSheet =====

export type BottomSheetStyle = ColorStyle &
  BorderStyle &
  ShadowStyle &
  FlexChildStyle & {
    /** Sheet height */
    height?: number;
  };

export interface BottomSheetProps extends WidgetProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  barrierColor?: string;
  showHandle?: boolean;
  /** Style override (height, borderRadius, backgroundColor, elevation) */
  style?: BottomSheetStyle;
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
  barrierColor = 'rgba(0,0,0,0.5)',
  showHandle = true,
  style,
  screenWidth = 360,
  screenHeight = 800,
}: BottomSheetProps) {
  const theme = useTheme();
  if (!visible) return null;

  const sheetHeight = style?.height ?? 400;
  const bgColor = style?.backgroundColor ?? theme.colors.surface;
  const borderR = style?.borderRadius ?? 24;
  const elev = style?.elevation ?? 16;

  return (
    <Group>
      <Overlay
        visible
        barrierColor={barrierColor}
        onPress={onClose}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
      <Box
        x={0}
        y={screenHeight - sheetHeight}
        style={{
          width: screenWidth,
          height: sheetHeight,
          borderRadius: borderR,
          backgroundColor: bgColor,
          elevation: elev,
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {showHandle && (
          <Box
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.textDisabled,
            }}
          />
        )}
        {children}
      </Box>
    </Group>
  );
});

// ===== Drawer =====

export type DrawerStyle = ColorStyle &
  ShadowStyle &
  FlexChildStyle & {
    /** Drawer width */
    width?: number;
  };

export interface DrawerProps extends WidgetProps {
  visible?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  barrierColor?: string;
  /** Style override (width, backgroundColor, elevation) */
  style?: DrawerStyle;
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
  side = 'left',
  barrierColor = 'rgba(0,0,0,0.5)',
  style,
  screenWidth = 360,
  screenHeight = 800,
}: DrawerProps) {
  const theme = useTheme();
  if (!visible) return null;

  const drawerWidth = style?.width ?? 280;
  const bgColor = style?.backgroundColor ?? theme.colors.surface;
  const elev = style?.elevation ?? 16;
  const drawerX = side === 'left' ? 0 : screenWidth - drawerWidth;

  return (
    <Group>
      <Overlay
        visible
        barrierColor={barrierColor}
        onPress={onClose}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
      <Box
        x={drawerX}
        y={0}
        style={{
          width: drawerWidth,
          height: screenHeight,
          backgroundColor: bgColor,
          elevation: elev,
        }}
        hitTestBehavior="opaque"
      >
        {children}
      </Box>
    </Group>
  );
});
