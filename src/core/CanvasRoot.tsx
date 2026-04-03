import * as React from 'react';
import { useCallback } from 'react';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  GestureDetector as RNGestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useOverlayStore } from '../stores/overlayStore';
import { useEventStore } from '../stores/eventStore';

interface CanvasRootProps {
  /** Style cho Canvas container */
  style?: ViewStyle;
  /** Canvas ID for multi-canvas scenarios (default: 'main') */
  canvasId?: string;
  /** Widget tree */
  children?: React.ReactNode;
}

/**
 * CanvasRoot — Root canvas duy nhất cho toàn bộ ứng dụng.
 * Tương đương Flutter MaterialApp — wrap tất cả widgets.
 *
 * Features:
 * - Renders all child widgets on a single Skia Canvas
 * - Overlay layer: renders overlayStore entries on top of everything
 * - Touch event dispatch: GestureHandler → eventStore.hitTest → widget callbacks
 *
 * Usage:
 * ```tsx
 * <GestureHandlerRootView style={{ flex: 1 }}>
 *   <CanvasRoot>
 *     <Box ... />
 *     <Text ... />
 *   </CanvasRoot>
 * </GestureHandlerRootView>
 * ```
 */
export const CanvasRoot = React.memo(function CanvasRoot({
  style,
  canvasId = 'main',
  children,
}: CanvasRootProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const overlaysMap = useOverlayStore((s) => s.overlays);
  const overlays = Array.from(overlaysMap.values());

  // Sort overlays by zIndex (lower zIndex drawn first, higher drawn on top)
  const sortedOverlays = [...overlays].sort((a, b) => a.zIndex - b.zIndex);

  // === Touch Event Dispatch ===
  // All gesture callbacks run on JS thread via .runOnJS(true)
  // because they access zustand stores which are JS-thread only

  const dispatchPress = useCallback(
    (x: number, y: number) => {
      const receivers = useEventStore.getState().hitTest(canvasId, x, y);
      for (const receiver of receivers) {
        receiver.entry.callbacks.onPress?.(receiver.localX, receiver.localY);
      }
    },
    [canvasId]
  );

  const dispatchLongPress = useCallback(
    (x: number, y: number) => {
      const receivers = useEventStore.getState().hitTest(canvasId, x, y);
      for (const receiver of receivers) {
        receiver.entry.callbacks.onLongPress?.();
      }
    },
    [canvasId]
  );

  // Tap gesture → onPress
  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      dispatchPress(e.absoluteX, e.absoluteY);
    });

  // Long press gesture → onLongPress
  const longPressGesture = Gesture.LongPress()
    .runOnJS(true)
    .minDuration(500)
    .onEnd((e) => {
      dispatchLongPress(e.absoluteX, e.absoluteY);
    });

  // Pan gesture → onPanStart/onPanUpdate/onPanEnd
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      const receivers = useEventStore
        .getState()
        .hitTest(canvasId, e.absoluteX, e.absoluteY);
      for (const receiver of receivers) {
        receiver.entry.callbacks.onPanStart?.({
          translationX: e.translationX,
          translationY: e.translationY,
          velocityX: e.velocityX,
          velocityY: e.velocityY,
          absoluteX: e.absoluteX,
          absoluteY: e.absoluteY,
          localX: receiver.localX,
          localY: receiver.localY,
        });
      }
    })
    .onUpdate((e) => {
      const receivers = useEventStore
        .getState()
        .hitTest(canvasId, e.absoluteX, e.absoluteY);
      for (const receiver of receivers) {
        receiver.entry.callbacks.onPanUpdate?.({
          translationX: e.translationX,
          translationY: e.translationY,
          velocityX: e.velocityX,
          velocityY: e.velocityY,
          absoluteX: e.absoluteX,
          absoluteY: e.absoluteY,
          localX: receiver.localX,
          localY: receiver.localY,
        });
      }
    })
    .onEnd((e) => {
      const receivers = useEventStore
        .getState()
        .hitTest(canvasId, e.absoluteX, e.absoluteY);
      for (const receiver of receivers) {
        receiver.entry.callbacks.onPanEnd?.({
          translationX: e.translationX,
          translationY: e.translationY,
          velocityX: e.velocityX,
          velocityY: e.velocityY,
          absoluteX: e.absoluteX,
          absoluteY: e.absoluteY,
          localX: receiver.localX,
          localY: receiver.localY,
        });
      }
    });

  // Combine gestures: tap and long press are exclusive, pan is simultaneous
  const composedGesture = Gesture.Race(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  return (
    <RNGestureDetector gesture={composedGesture}>
      <Canvas style={[{ width: screenWidth, height: screenHeight }, style]}>
        {/* 1. Main application UI */}
        {children}

        {/* 2. Overlay layer — always drawn on top */}
        {sortedOverlays.map((overlay) => (
          <Group key={overlay.id}>{overlay.node}</Group>
        ))}
      </Canvas>
    </RNGestureDetector>
  );
});
