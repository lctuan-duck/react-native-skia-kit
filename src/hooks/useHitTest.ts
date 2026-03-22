import { useEffect } from 'react';
import { useEventStore } from '../stores/eventStore';
import type { HitRect, HitTestBehavior } from '../stores/eventStore';
import type { GestureCallbacks } from '../core/types';

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
  const hasCallbacks =
    !!callbacks.onPress ||
    !!callbacks.onLongPress ||
    !!callbacks.onPanStart ||
    !!callbacks.onPanUpdate ||
    !!callbacks.onPanEnd;

  // Register/unregister on mount/unmount, and update when rect or callbacks change
  useEffect(() => {
    if (!hasCallbacks) return;

    useEventStore.getState().registerHit(canvasId, widgetId, {
      widgetId,
      parentId: null,
      rect,
      zIndex,
      hitTestBehavior: behavior,
      callbacks,
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
    callbacks.onPress,
    callbacks.onLongPress,
    callbacks.onPanStart,
    callbacks.onPanUpdate,
    callbacks.onPanEnd,
  ]);
}
