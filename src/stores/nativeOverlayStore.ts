import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type { ReactNode } from 'react';

export interface NativeOverlayEntry {
  id: string;
  node: ReactNode;
  zIndex: number;
}


interface NativeOverlayStoreState {
  overlays: Map<string, NativeOverlayEntry>;

  showOverlay: (id: string, node: ReactNode, zIndex?: number) => void;
  hideOverlay: (id: string) => void;
  updateOverlay: (id: string, node: ReactNode) => void;
  clearAll: () => void;
  getOverlays: () => NativeOverlayEntry[];
}

export const useNativeOverlayStore = create<NativeOverlayStoreState>()(
  immer((set, get) => ({
    overlays: new Map<string, NativeOverlayEntry>(),

    showOverlay: (id, node, zIndex = 100) =>
      set((state) => {
        state.overlays.set(id, { id, node, zIndex });
      }),

    updateOverlay: (id, node) =>
      set((state) => {
        const existing = state.overlays.get(id);
        if (existing) {
          state.overlays.set(id, { ...existing, node });
        }
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
