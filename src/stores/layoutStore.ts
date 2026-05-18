import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type { LayoutRect } from '../types/widget.types';

export interface LayoutConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export interface LayoutEntry {
  rect: LayoutRect;
  constraints?: LayoutConstraints;
}

// ===== Store =====

interface LayoutStoreState {
  layoutMap: Map<string, LayoutEntry>;

  setLayout: (
    widgetId: string,
    rect: LayoutRect,
    constraints?: LayoutConstraints
  ) => void;
  removeLayout: (widgetId: string) => void;
  clearLayout: () => void;
  getLayout: (widgetId: string) => LayoutEntry | undefined;

  // Batch update multiple layouts
  setLayouts: (layoutsMap: Record<string, LayoutEntry>) => void;
}

export const useLayoutStore = create<LayoutStoreState>()(
  immer((set, get) => ({
    layoutMap: new Map<string, LayoutEntry>(),

    setLayout: (widgetId, rect, constraints) =>
      set((state) => {
        state.layoutMap.set(widgetId, { rect, constraints });
      }),

    setLayouts: (layoutsMap) =>
      set((state) => {
        Object.entries(layoutsMap).forEach(([widgetId, entry]) => {
          state.layoutMap.set(widgetId, entry);
        });
      }),

    removeLayout: (widgetId) =>
      set((state) => {
        state.layoutMap.delete(widgetId);
      }),

    clearLayout: () =>
      set((state) => {
        state.layoutMap = new Map();
      }),

    getLayout: (widgetId) => {
      return get().layoutMap.get(widgetId);
    },
  }))
);
