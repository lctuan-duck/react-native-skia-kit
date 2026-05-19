import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type { LayoutRect } from '../types/widget.types';
import { uiEngine } from '../core/GlobalEngine';

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

// ===== Batched Layout Calculation =====
// Prevents O(n²) layout recalculations during component mount phase.
// Multiple triggerLayout() calls within the same React batch are coalesced
// into a single queueMicrotask callback.
let _pendingLayout = false;

function scheduleBatchedLayout() {
  if (_pendingLayout) return; // Already scheduled, skip
  _pendingLayout = true;

  queueMicrotask(() => {
    _pendingLayout = false;
    const state = useLayoutStore.getState();
    if (!uiEngine || !state.rootId) return;

    // Calculate layout once for the entire tree
    uiEngine.calculateLayout(state.rootId, state.rootWidth, state.rootHeight);

    // Batch-update all widget positions in store
    const allLayouts = uiEngine.getAllLayouts();
    const layoutEntries: Record<string, LayoutEntry> = {};
    for (const [id, rect] of Object.entries(allLayouts)) {
      layoutEntries[id] = { rect };
    }
    state.setLayouts(layoutEntries);
  });
}

// ===== Store =====

interface LayoutStoreState {
  layoutMap: Record<string, LayoutEntry>;

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

  // Tree management
  tree: Map<string, string[]>;
  appendChild: (parentId: string, childId: string) => void;
  removeChild: (parentId: string, childId: string) => void;
  triggerLayout: (rootId?: string, width?: number, height?: number) => void;

  // Root configuration
  rootId: string | null;
  rootWidth: number;
  rootHeight: number;
  setRoot: (rootId: string, width: number, height: number) => void;
}

export const useLayoutStore = create<LayoutStoreState>()(
  immer((set, get) => ({
    layoutMap: {},

    setLayout: (widgetId, rect, constraints) =>
      set((state) => {
        state.layoutMap[widgetId] = { rect, constraints };
      }),

    setLayouts: (layoutsMap) =>
      set((state) => {
        Object.entries(layoutsMap).forEach(([widgetId, entry]) => {
          state.layoutMap[widgetId] = entry;
        });
      }),

    removeLayout: (widgetId) =>
      set((state) => {
        delete state.layoutMap[widgetId];
      }),

    clearLayout: () =>
      set((state) => {
        state.layoutMap = {};
        state.tree = new Map();
      }),

    getLayout: (widgetId) => {
      return get().layoutMap[widgetId];
    },

    // --- Tree Management ---
    tree: new Map<string, string[]>(),

    appendChild: (parentId, childId) => {
      let changed = false;
      let newChildren: string[] = [];
      set((state) => {
        const children = state.tree.get(parentId) || [];
        if (!children.includes(childId)) {
          newChildren = [...children, childId];
          state.tree.set(parentId, newChildren);
          changed = true;
        }
      });
      if (changed && uiEngine) {
        uiEngine.setChildren(parentId, newChildren);
      }
    },

    removeChild: (parentId, childId) => {
      let changed = false;
      let newChildren: string[] = [];
      set((state) => {
        const children = state.tree.get(parentId) || [];
        newChildren = children.filter((id) => id !== childId);
        if (newChildren.length !== children.length) {
          state.tree.set(parentId, newChildren);
          changed = true;
        }
      });
      if (changed && uiEngine) {
        uiEngine.setChildren(parentId, newChildren);
      }
    },

    triggerLayout: (_rootId, _width, _height) => {
      // Delegate to batched scheduler — all calls within the same
      // React commit phase are coalesced into one calculation.
      scheduleBatchedLayout();
    },

    // --- Root Configuration ---
    rootId: null,
    rootWidth: 0,
    rootHeight: 0,

    setRoot: (rootId, width, height) => {
      set((state) => {
        state.rootId = rootId;
        state.rootWidth = width;
        state.rootHeight = height;
      });
    },
  }))
);
