import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNativeOverlayStore } from '../stores/nativeOverlayStore';

/**
 * useNativeOverlay
 * Allows a SkiaKit component (which is rendered in C++ and has no native view)
 * to mount a React Native component (like TextInput) into the NativeOverlayProvider.
 *
 * It takes the widget's generated ID to uniquely identify the overlay.
 */
export function useNativeOverlay(id: string) {
  const { showOverlay, hideOverlay, updateOverlay } = useNativeOverlayStore.getState();

  const show = useCallback(
    (node: ReactNode, zIndex = 100) => {
      showOverlay(id, node, zIndex);
    },
    [id, showOverlay]
  );

  const update = useCallback(
    (node: ReactNode) => {
      updateOverlay(id, node);
    },
    [id, updateOverlay]
  );

  const hide = useCallback(() => {
    hideOverlay(id);
  }, [id, hideOverlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hideOverlay(id);
    };
  }, [id, hideOverlay]);

  return { show, update, hide };
}
