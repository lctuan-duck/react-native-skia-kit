import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type { ReactNode } from 'react';

// ===== Types =====

export interface OverlayEntry {
  id: string;
  node: ReactNode;
  zIndex: number;
}

interface OverlayStoreState {
  /**
   * BUG-2 Fix: scope overlays theo canvasId để tránh hiển thị đúp trên nhiều CanvasRoot.
   * Map<canvasId, Map<overlayId, OverlayEntry>>
   */
  overlaysByCanvas: Map<string, Map<string, OverlayEntry>>;

  showOverlay: (canvasId: string, id: string, node: ReactNode, zIndex?: number) => void;
  hideOverlay: (canvasId: string, id: string) => void;
  clearAll: (canvasId: string) => void;
  getOverlays: (canvasId: string) => OverlayEntry[];
}

export const useOverlayStore = create<OverlayStoreState>()(
  immer((set, get) => ({
    overlaysByCanvas: new Map<string, Map<string, OverlayEntry>>(),

    showOverlay: (canvasId, id, node, zIndex = 100) =>
      set((state) => {
        if (!state.overlaysByCanvas.has(canvasId)) {
          state.overlaysByCanvas.set(canvasId, new Map());
        }
        state.overlaysByCanvas.get(canvasId)!.set(id, { id, node, zIndex });
      }),

    hideOverlay: (canvasId, id) =>
      set((state) => {
        state.overlaysByCanvas.get(canvasId)?.delete(id);
      }),

    clearAll: (canvasId) =>
      set((state) => {
        state.overlaysByCanvas.delete(canvasId);
      }),

    getOverlays: (canvasId) => {
      const entries = Array.from(get().overlaysByCanvas.get(canvasId)?.values() ?? []);
      return entries.sort((a, b) => a.zIndex - b.zIndex);
    },
  }))
);
