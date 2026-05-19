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
// into a single requestAnimationFrame callback.
let _pendingLayout = false;

// Track which widget IDs are currently alive (have a Yoga node registered
// via updateLayoutNode). This prevents calling setChildren for stale
// entries that linger in the JS tree map after components unmount.
const _liveNodes = new Set<string>();

export function registerLiveNode(id: string) {
  _liveNodes.add(id);
}
export function unregisterLiveNode(id: string) {
  _liveNodes.delete(id);
}

function scheduleBatchedLayout() {
  if (_pendingLayout) return;
  _pendingLayout = true;

  queueMicrotask(() => {
    _pendingLayout = false;
    console.time('Layout Batch');
    const state = useLayoutStore.getState();
    if (!uiEngine || !state.rootId) return;

    // Rebuild C++ tree from JS tree map BEFORE calculating layout.
    // Only process entries whose parent is a live node to avoid
    // recreating freed Yoga nodes via getOrCreateYogaNode.
    for (const [parentId, children] of state.tree) {
      if (!_liveNodes.has(parentId)) continue;
      // Filter out children that are no longer live
      const liveChildren = children.filter((c) => _liveNodes.has(c));
      uiEngine.setChildren(parentId, liveChildren);
    }

    // Calculate layout once for the entire tree
    uiEngine.calculateLayout(state.rootId, state.rootWidth, state.rootHeight);

    // Batch-update all widget positions in store
    const allLayouts = uiEngine.getAllLayouts();
    const layoutEntries: Record<string, LayoutEntry> = {};
    let hasChanges = false;

    for (const [id, rect] of Object.entries(allLayouts)) {
      const current = state.layoutMap[id];
      if (
        !current ||
        current.rect.x !== rect.x ||
        current.rect.y !== rect.y ||
        current.rect.width !== rect.width ||
        current.rect.height !== rect.height
      ) {
        layoutEntries[id] = { rect, constraints: current?.constraints };
        hasChanges = true;
      }
    }

    if (hasChanges) {
      state.setLayouts(layoutEntries);
    }
    console.timeEnd('Layout Batch');
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
      set((state) => {
        const children = state.tree.get(parentId) || [];
        if (!children.includes(childId)) {
          state.tree.set(parentId, [...children, childId]);
        }
      });
      // NOTE: uiEngine.setChildren is deferred to scheduleBatchedLayout
      // to avoid calling it before parent nodes are registered in C++.
    },

    removeChild: (parentId, childId) => {
      set((state) => {
        const children = state.tree.get(parentId) || [];
        const newChildren = children.filter((id) => id !== childId);
        if (newChildren.length !== children.length) {
          state.tree.set(parentId, newChildren);
        }
        // Also clean up the child node's own tree entry to prevent
        // stale empty entries from accumulating in the map.
        state.tree.delete(childId);
      });
      // NOTE: uiEngine.setChildren is deferred to scheduleBatchedLayout
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
