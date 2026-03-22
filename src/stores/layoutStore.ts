import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type { LayoutRect } from '../core/types';

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
  dirtyWidgets: Set<string>;
  yogaNodeMap: Map<string, unknown>;

  setLayout: (
    widgetId: string,
    rect: LayoutRect,
    constraints?: LayoutConstraints
  ) => void;
  removeLayout: (widgetId: string) => void;
  clearLayout: () => void;
  markNeedsLayout: (widgetId: string) => void;
  clearDirty: (widgetId: string) => void;
  clearAllDirty: () => void;
  isDirty: (widgetId: string) => boolean;
  getLayout: (widgetId: string) => LayoutEntry | undefined;

  // Yoga node management
  setYogaNode: (widgetId: string, node: unknown) => void;
  getYogaNode: (widgetId: string) => unknown | undefined;
  removeYogaNode: (widgetId: string) => void;

  // Batch recalculate dirty widgets
  recalculateLayout: (yogaEngine?: unknown) => void;
}

export const useLayoutStore = create<LayoutStoreState>()(
  immer((set, get) => ({
    layoutMap: new Map<string, LayoutEntry>(),
    dirtyWidgets: new Set<string>(),
    yogaNodeMap: new Map<string, unknown>(),

    setLayout: (widgetId, rect, constraints) =>
      set((state) => {
        state.layoutMap.set(widgetId, { rect, constraints });
        state.dirtyWidgets.delete(widgetId);
      }),

    removeLayout: (widgetId) =>
      set((state) => {
        state.layoutMap.delete(widgetId);
        state.dirtyWidgets.delete(widgetId);
      }),

    clearLayout: () =>
      set((state) => {
        state.layoutMap = new Map();
        state.dirtyWidgets = new Set();
      }),

    markNeedsLayout: (widgetId) =>
      set((state) => {
        state.dirtyWidgets.add(widgetId);
      }),

    clearDirty: (widgetId) =>
      set((state) => {
        state.dirtyWidgets.delete(widgetId);
      }),

    clearAllDirty: () =>
      set((state) => {
        state.dirtyWidgets.clear();
      }),

    isDirty: (widgetId) => {
      return get().dirtyWidgets.has(widgetId);
    },

    getLayout: (widgetId) => {
      return get().layoutMap.get(widgetId);
    },

    setYogaNode: (widgetId, node) =>
      set((state) => {
        state.yogaNodeMap.set(widgetId, node);
      }),

    getYogaNode: (widgetId) => {
      return get().yogaNodeMap.get(widgetId);
    },

    removeYogaNode: (widgetId) =>
      set((state) => {
        state.yogaNodeMap.delete(widgetId);
      }),

    recalculateLayout: (yogaEngine) =>
      set((state) => {
        if (!yogaEngine) {
          state.dirtyWidgets.clear();
          return;
        }
        const engine = yogaEngine as {
          calculateForWidget?: (widgetId: string) => LayoutRect | null;
        };
        for (const widgetId of state.dirtyWidgets) {
          const newLayout = engine.calculateForWidget?.(widgetId);
          if (newLayout) {
            state.layoutMap.set(widgetId, { rect: newLayout });
          }
        }
        state.dirtyWidgets.clear();
      }),
  }))
);
