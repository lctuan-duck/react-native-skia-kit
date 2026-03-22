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
  overlays: Map<string, OverlayEntry>;

  showOverlay: (id: string, node: ReactNode, zIndex?: number) => void;
  hideOverlay: (id: string) => void;
  clearAll: () => void;
  getOverlays: () => OverlayEntry[];
}

export const useOverlayStore = create<OverlayStoreState>()(
  immer((set, get) => ({
    overlays: new Map<string, OverlayEntry>(),

    showOverlay: (id, node, zIndex = 100) =>
      set((state) => {
        state.overlays.set(id, { id, node, zIndex });
      }),

    hideOverlay: (id) =>
      set((state) => {
        state.overlays.delete(id);
      }),

    clearAll: () =>
      set((state) => {
        state.overlays.clear();
      }),

    getOverlays: () => {
      const entries = Array.from(get().overlays.values());
      return entries.sort((a, b) => a.zIndex - b.zIndex);
    },
  }))
);
