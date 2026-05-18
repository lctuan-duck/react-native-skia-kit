import * as React from 'react';
import { useCallback, useLayoutEffect } from 'react';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  GestureDetector as RNGestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useOverlayStore } from '../stores/overlayStore';
import { useEventStore } from '../stores/eventStore';
import { useLayoutStore } from '../stores/layoutStore';
import { runOnJS } from 'react-native-reanimated';
import {
  uiEngine,
  globalActiveWidgetId,
  globalPanEvent,
  globalPanState,
} from './GlobalEngine';

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

  // === YOGA LAYOUT ===

  useLayoutEffect(() => {
    // 1. Register Canvas Root node
    uiEngine.updateLayoutNode(canvasId, {
      flexDirection: 'column',
      justifyContent: 'start',
      alignItems: 'stretch',
      width: screenWidth > 0 ? screenWidth : undefined,
      height: screenHeight > 0 ? screenHeight : undefined,
    });

    // Parse children IDs
    const childIds: string[] = [];
    React.Children.forEach(children, (child) => {
      if (
        React.isValidElement(child) &&
        child.props &&
        typeof child.props === 'object' &&
        'id' in child.props
      ) {
        childIds.push((child.props as any).id);
      }
    });
    uiEngine.setChildren(canvasId, childIds);

    // 2. Trigger Yoga calculation
    uiEngine.calculateLayout(canvasId, screenWidth, screenHeight);

    // 3. Fetch all computed layouts and update JS store for rendering
    const allLayouts = uiEngine.getAllLayouts();
    const layoutEntries: Record<
      string,
      { rect: { x: number; y: number; width: number; height: number } }
    > = {};
    for (const [id, rect] of Object.entries(allLayouts)) {
      layoutEntries[id] = { rect };
    }
    useLayoutStore.getState().setLayouts(layoutEntries);
  }, [canvasId, screenWidth, screenHeight, children]);

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

  const dispatchJSPan = useCallback(
    (type: 'start' | 'update' | 'end', e: any) => {
      const receivers = useEventStore
        .getState()
        .hitTest(canvasId, e.absoluteX, e.absoluteY);
      for (const receiver of receivers) {
        if (type === 'start')
          receiver.entry.callbacks.onPanStart?.({
            ...e,
            localX: receiver.localX,
            localY: receiver.localY,
          });
        else if (type === 'update')
          receiver.entry.callbacks.onPanUpdate?.({
            ...e,
            localX: receiver.localX,
            localY: receiver.localY,
          });
        else if (type === 'end')
          receiver.entry.callbacks.onPanEnd?.({
            ...e,
            localX: receiver.localX,
            localY: receiver.localY,
          });
      }
    },
    [canvasId]
  );

  // Pan gesture → onPanStart/onPanUpdate/onPanEnd
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      'worklet';
      const hits = uiEngine.hitTest(e.absoluteX, e.absoluteY);
      if (hits && hits.length > 0) {
        globalActiveWidgetId.value = hits[0] || null;
      } else {
        globalActiveWidgetId.value = null;
      }
      globalPanEvent.value = e as any;
      globalPanState.value = 'start';
      runOnJS(dispatchJSPan)('start', e);
    })
    .onUpdate((e) => {
      'worklet';
      globalPanEvent.value = e as any;
      globalPanState.value = 'update';
      runOnJS(dispatchJSPan)('update', e);
    })
    .onEnd((e) => {
      'worklet';
      globalPanEvent.value = e as any;
      globalPanState.value = 'end';
      globalActiveWidgetId.value = null;
      runOnJS(dispatchJSPan)('end', e);
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
