import * as React from 'react';
import { useEffect } from 'react';
import { useEventStore } from '../stores/eventStore';
import type { HitRect, HitTestBehavior } from '../stores/eventStore';
import type { GestureCallbacks } from '../types/widget.types';

export interface UseHitTestOptions {
  rect: HitRect;
  callbacks: GestureCallbacks;
  behavior?: HitTestBehavior;
  zIndex?: number;
  canvasId?: string;
}

/**
 * Register a widget's hit area and event callbacks in the eventStore.
 * Auto-registers on mount, auto-unregisters on unmount.
 * Only registers when at least one callback is provided.
 */
export function useHitTest(
  widgetId: string,
  {
    rect,
    callbacks,
    behavior = 'deferToChild',
    zIndex = 0,
    canvasId = 'main',
  }: UseHitTestOptions
): void {
  const callbacksRef = React.useRef(callbacks);
  callbacksRef.current = callbacks;

  const hasCallbacks =
    !!callbacks.onPress ||
    !!callbacks.onLongPress ||
    !!callbacks.onPanStart ||
    !!callbacks.onPanUpdate ||
    !!callbacks.onPanEnd;

  // Register/unregister on mount/unmount, and update when rect changes.
  // We DO NOT depend on callback references to avoid React render churn.
  useEffect(() => {
    if (!hasCallbacks) return;

    // Stable wrapper to always call the latest function reference without re-registering
    const stableCallbacks: GestureCallbacks = {
      onPress: (x, y) => callbacksRef.current.onPress?.(x, y),
      onLongPress: () => callbacksRef.current.onLongPress?.(),
      onPanStart: (e) => callbacksRef.current.onPanStart?.(e),
      onPanUpdate: (e) => callbacksRef.current.onPanUpdate?.(e),
      onPanEnd: (e) => callbacksRef.current.onPanEnd?.(e),
    };

    useEventStore.getState().registerHit(canvasId, widgetId, {
      widgetId,
      parentId: null,
      rect,
      zIndex,
      hitTestBehavior: behavior,
      callbacks: stableCallbacks,
    });

    return () => {
      useEventStore.getState().unregisterHit(canvasId, widgetId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    widgetId,
    canvasId,
    rect.left,
    rect.top,
    rect.width,
    rect.height,
    zIndex,
    behavior,
    hasCallbacks,
  ]);
}
