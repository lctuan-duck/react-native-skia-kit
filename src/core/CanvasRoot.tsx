import * as React from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  GestureDetector as RNGestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useOverlayStore } from '../stores/overlayStore';
import { useEventStore } from '../stores/eventStore';
import { useLayoutStore, registerLiveNode, unregisterLiveNode } from '../stores/layoutStore';
import { runOnJS } from 'react-native-reanimated';
import {
  uiEngine,
  globalActiveWidgetId,
  globalPanEvent,
  globalPanState,
} from './GlobalEngine';
import { WidgetContext } from './WidgetContext';

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
    registerLiveNode(canvasId);

    // 2. Cache root configuration
    useLayoutStore.getState().setRoot(canvasId, screenWidth, screenHeight);

    // 3. Trigger Yoga calculation
    useLayoutStore.getState().triggerLayout();

    return () => {
      unregisterLiveNode(canvasId);
    };
  }, [canvasId, screenWidth, screenHeight]);

  // === Touch Event Dispatch ===
  // All gesture callbacks run on JS thread via .runOnJS(true)
  // because they access zustand stores which are JS-thread only

  const dispatchPress = useCallback(
    (x: number, y: number) => {
      const hits = uiEngine.hitTest(x, y);
      const hitMap = useEventStore.getState().hitMaps.get(canvasId);
      if (!hitMap) return;

      for (const hit of hits) {
        const entry = hitMap.get(hit.id);
        if (entry) {
          entry.callbacks.onPress?.(hit.localX, hit.localY);
        }
      }
    },
    [canvasId]
  );

  const dispatchLongPress = useCallback(
    (x: number, y: number) => {
      const hits = uiEngine.hitTest(x, y);
      const hitMap = useEventStore.getState().hitMaps.get(canvasId);
      if (!hitMap) return;

      for (const hit of hits) {
        const entry = hitMap.get(hit.id);
        if (entry) {
          entry.callbacks.onLongPress?.();
        }
      }
    },
    [canvasId]
  );

  // Tap gesture → onPress
  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onBegin((e) => {
      const hits = uiEngine.hitTest(e.absoluteX, e.absoluteY);
      const hitMap = useEventStore.getState().hitMaps.get(canvasId);
      if (!hitMap) return;

      for (const hit of hits) {
        const entry = hitMap.get(hit.id);
        if (entry) {
          entry.callbacks.onPressIn?.(hit.localX, hit.localY);
        }
      }
    })
    .onEnd((e) => {
      dispatchPress(e.absoluteX, e.absoluteY);
    })
    .onFinalize((e) => {
      const hits = uiEngine.hitTest(e.absoluteX, e.absoluteY);
      const hitMap = useEventStore.getState().hitMaps.get(canvasId);
      if (!hitMap) return;

      for (const hit of hits) {
        const entry = hitMap.get(hit.id);
        if (entry) {
          entry.callbacks.onPressOut?.(hit.localX, hit.localY);
        }
      }
    });

  // Long press gesture → onLongPress
  const longPressGesture = Gesture.LongPress()
    .runOnJS(true)
    .minDuration(500)
    .onEnd((e) => {
      dispatchLongPress(e.absoluteX, e.absoluteY);
    });

  const capturedHitsRef = useRef<any[]>([]);

  const dispatchJSPan = useCallback(
    (type: 'start' | 'update' | 'end', e: any) => {
      const hitMap = useEventStore.getState().hitMaps.get(canvasId);
      if (!hitMap) return;

      let hits = type === 'start' ? uiEngine.hitTest(e.absoluteX, e.absoluteY) : capturedHitsRef.current;

      if (type === 'start') {
        capturedHitsRef.current = hits;
        const scrollAreas = useEventStore.getState().scrollAreas;
        let activeScrollId: string | null = null;
        if (hits) {
          for (const hit of hits) {
            if (scrollAreas.has(hit.id)) {
              activeScrollId = hit.id;
              break;
            }
          }
        }
        globalActiveWidgetId.value = activeScrollId ? activeScrollId : (hits && hits.length > 0) ? (hits[0]?.id || null) : null;
      }

      for (const hit of hits) {
        const entry = hitMap.get(hit.id);
        if (!entry) continue;

        if (type === 'start')
          entry.callbacks.onPanStart?.({
            ...e,
            localX: hit.localX,
            localY: hit.localY,
          });
        else if (type === 'update')
          entry.callbacks.onPanUpdate?.({
            ...e,
            localX: hit.localX + e.translationX,
            localY: hit.localY + e.translationY,
          });
        else if (type === 'end')
          entry.callbacks.onPanEnd?.({
            ...e,
            localX: hit.localX + e.translationX,
            localY: hit.localY + e.translationY,
          });
      }
    },
    [canvasId]
  );

  // Pan gesture → onPanStart/onPanUpdate/onPanEnd
  // minDistance(10) prevents Pan from activating on simple taps,
  // allowing Tap gesture to complete and fire onPress callbacks.
  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onStart((e) => {
      'worklet';
      globalPanState.value = 'start';
      globalPanEvent.value = e as any;
      runOnJS(dispatchJSPan)('start', e);
    })
    .onUpdate((e) => {
      'worklet';
      globalPanState.value = 'update';
      globalPanEvent.value = e as any;
      runOnJS(dispatchJSPan)('update', e);
    })
    .onEnd((e) => {
      'worklet';
      globalPanState.value = 'end';
      globalPanEvent.value = e as any;
      runOnJS(dispatchJSPan)('end', e);
    });

  // Combine gestures: Tap and LongPress are exclusive (only one fires),
  // Pan runs simultaneously so scrolling works alongside taps.
  const composedGesture = Gesture.Simultaneous(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  return (
    <RNGestureDetector gesture={composedGesture}>
      <Canvas style={[{ width: screenWidth, height: screenHeight }, style]}>
        <WidgetContext.Provider value={canvasId}>
          {/* 1. Main application UI */}
          {children}

          {/* 2. Overlay layer — always drawn on top */}
          {sortedOverlays.map((overlay) => (
            <Group key={overlay.id}>{overlay.node}</Group>
          ))}
        </WidgetContext.Provider>
      </Canvas>
    </RNGestureDetector>
  );
});
