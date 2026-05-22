import { useEffect } from 'react';
import { useRef } from 'react';
import { uiEngine } from '../core/GlobalEngine';
import type { GestureCallbacks, HitTestBehavior } from '../types/widget.types';

export interface HitRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface UseHitTestOptions {
  rect: HitRect;
  callbacks: GestureCallbacks;
  behavior?: HitTestBehavior;
  zIndex?: number;
  canvasId?: string;
}

/**
 * useHitTest — Rewrite cho v2.
 *
 * Trong v2, hit testing được quản lý hoàn toàn bởi C++ HitTestSubsystem.
 * Reconciler tự động register widget qua `uiEngine.registerWidget()` khi component mount.
 * Hook này chỉ cần thiết cho các component KHÔNG render qua Reconciler
 * (ví dụ: custom manual canvas elements).
 *
 * Cho các component render qua Box/Text/Image: KHÔNG cần dùng hook này.
 * Gesture callbacks được register tự động trong SkiaKitReconciler.createInstance.
 */
export function useHitTest(
  widgetId: string,
  {
    rect,
    callbacks,
    behavior = 'deferToChild',
    zIndex = 0,
  }: UseHitTestOptions
): void {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const hasCallbacks =
    !!callbacks.onPress ||
    !!callbacks.onLongPress ||
    !!callbacks.onPanStart ||
    !!callbacks.onPanUpdate ||
    !!callbacks.onPanEnd;

  useEffect(() => {
    if (!hasCallbacks) return;
    const behaviorCode = behavior === 'opaque' ? 1 : 0;
    uiEngine.registerWidget(
      widgetId,
      rect.left,
      rect.top,
      rect.width,
      rect.height,
      zIndex,
      behaviorCode
    );
    return () => {
      uiEngine.unregisterWidget(widgetId);
    };
  }, [widgetId, rect.left, rect.top, rect.width, rect.height, zIndex, behavior, hasCallbacks]);
}
