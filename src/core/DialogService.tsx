/**
 * Dialog & Sheet convenience functions.
 * Equivalent to Flutter's showDialog() and showModalBottomSheet().
 *
 * These use overlayStore under the hood — no need to manage visible state manually.
 */

import * as React from 'react';
import { useOverlayStore } from '../stores/overlayStore';
import { Modal, BottomSheet } from '../components/Overlay';
import { Box } from '../components/Box';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import type { ButtonVariant } from '../components/Button';

// ===== showDialog =====

export interface DialogOptions {
  /** Unique dialog ID (auto-generated if omitted) */
  id?: string;
  /** Title text */
  title?: string;
  /** Content text or custom JSX */
  content?: string | React.ReactNode;
  /** Dialog width */
  width?: number;
  /** Dialog height */
  height?: number;
  /** Barrier dismissible (tap outside to close) */
  barrierDismissible?: boolean;
  /** Action buttons */
  actions?: {
    label: string;
    onPress?: () => void;
    variant?: ButtonVariant;
  }[];
  /** Screen dimensions */
  screenWidth?: number;
  screenHeight?: number;
}

let dialogCounter = 0;

/**
 * Show a dialog overlay.
 * Equivalent to Flutter's showDialog().
 *
 * @returns dismiss function
 *
 * @example
 * const dismiss = showDialog({
 *   title: 'Delete item?',
 *   content: 'This action cannot be undone.',
 *   actions: [
 *     { label: 'Cancel', variant: 'ghost', onPress: () => dismiss() },
 *     { label: 'Delete', onPress: () => { deleteItem(); dismiss(); } },
 *   ],
 * });
 */
export function showDialog(options: DialogOptions): () => void {
  const id = options.id ?? `dialog-${++dialogCounter}`;
  const {
    title,
    content,
    width = 280,
    height = 180,
    barrierDismissible = true,
    actions = [],
    screenWidth = 360,
    screenHeight = 800,
  } = options;

  const dismiss = () => {
    useOverlayStore.getState().hideOverlay(id);
  };

  const dialogNode = (
    <Modal
      visible
      onClose={barrierDismissible ? dismiss : undefined}
      barrierDismissible={barrierDismissible}
      style={{ width, height }}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    >
      {/* Title */}
      {title && (
        <Text
          x={20}
          y={16}
          text={title}
          style={{ fontSize: 18, fontWeight: '600', width: width - 40 }}
        />
      )}
      {/* Content */}
      {typeof content === 'string' ? (
        <Text
          x={20}
          y={title ? 48 : 16}
          text={content}
          style={{ fontSize: 14, width: width - 40, color: 'rgba(0,0,0,0.6)' }}
        />
      ) : (
        content
      )}
      {/* Actions */}
      {actions.length > 0 && (
        <Box
          x={0}
          y={height - 52}
          style={{
            width,
            height: 52,
            flexDirection: 'row',
            justifyContent: 'end',
            padding: 8,
            gap: 8,
          }}
        >
          {actions.map((action, i) => (
            <Button
              key={i}
              text={action.label}
              variant={action.variant ?? 'ghost'}
              onPress={action.onPress}
              style={{ height: 36 }}
            />
          ))}
        </Box>
      )}
    </Modal>
  );

  useOverlayStore.getState().showOverlay(id, dialogNode, 200);
  return dismiss;
}

// ===== showBottomSheet =====

export interface BottomSheetOptions {
  id?: string;
  children: React.ReactNode;
  sheetHeight?: number;
  showHandle?: boolean;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Show a bottom sheet overlay.
 * Equivalent to Flutter's showModalBottomSheet().
 *
 * @returns dismiss function
 *
 * @example
 * const dismiss = showBottomSheet({
 *   children: <MySheetContent onDone={dismiss} />,
 *   sheetHeight: 300,
 * });
 */
export function showBottomSheet(options: BottomSheetOptions): () => void {
  const id = options.id ?? `sheet-${++dialogCounter}`;
  const {
    children,
    sheetHeight = 400,
    showHandle = true,
    screenWidth = 360,
    screenHeight = 800,
  } = options;

  const dismiss = () => {
    useOverlayStore.getState().hideOverlay(id);
  };

  const sheetNode = (
    <BottomSheet
      visible
      onClose={dismiss}
      style={{ height: sheetHeight }}
      showHandle={showHandle}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    >
      {children}
    </BottomSheet>
  );

  useOverlayStore.getState().showOverlay(id, sheetNode, 200);
  return dismiss;
}

// ===== showSnackBar =====

export interface SnackBarOptions {
  id?: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Show a snackbar.
 * Equivalent to Flutter's ScaffoldMessenger.showSnackBar().
 *
 * @returns dismiss function
 */
export function showSnackBar(options: SnackBarOptions): () => void {
  const id = options.id ?? `snack-${++dialogCounter}`;
  const {
    message,
    duration = 3000,
    actionLabel,
    onAction,
    screenWidth = 360,
    screenHeight = 800,
  } = options;

  const dismiss = () => {
    useOverlayStore.getState().hideOverlay(id);
  };

  const snackNode = (
    <Box
      x={16}
      y={screenHeight - 80}
      style={{
        width: screenWidth - 32,
        height: 48,
        borderRadius: 8,
        backgroundColor: 'rgba(50,50,50,0.95)',
        elevation: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'spaceBetween',
        padding: 16,
      }}
    >
      <Text
        text={message}
        style={{ fontSize: 14, color: '#ffffff', width: screenWidth - 120 }}
      />
      {actionLabel && (
        <Button
          text={actionLabel}
          variant="ghost"
          onPress={() => {
            onAction?.();
            dismiss();
          }}
          style={{ height: 32 }}
        />
      )}
    </Box>
  );

  useOverlayStore.getState().showOverlay(id, snackNode, 150);

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return dismiss;
}
