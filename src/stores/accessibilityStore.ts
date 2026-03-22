import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type * as React from 'react';

// ===== Types =====

export interface AccessibilityInfo {
  label?: string;
  role?:
    | 'button'
    | 'checkbox'
    | 'switch'
    | 'slider'
    | 'text'
    | 'image'
    | 'link'
    | 'header';
  value?: string;
  hint?: string;
  isEnabled?: boolean;
}

interface AccessibilityStoreState {
  focusWidgetId: string | null;
  accessibilityMap: Map<string, AccessibilityInfo>;
  nodesMap: Map<string, React.ReactNode>;

  setFocus: (widgetId: string | null) => void;
  setAccessibility: (widgetId: string, info: AccessibilityInfo) => void;
  removeAccessibility: (widgetId: string) => void;
  getAccessibility: (widgetId: string) => AccessibilityInfo | undefined;

  // Phase 13: Native overlay nodes
  registerNode: (widgetId: string, node: React.ReactNode) => void;
  unregisterNode: (widgetId: string) => void;
  getNodes: () => React.ReactNode[];
}

export const useAccessibilityStore = create<AccessibilityStoreState>()(
  immer((set, get) => ({
    focusWidgetId: null,
    accessibilityMap: new Map<string, AccessibilityInfo>(),
    nodesMap: new Map<string, React.ReactNode>(),

    setFocus: (widgetId) =>
      set((state) => {
        state.focusWidgetId = widgetId;
      }),

    setAccessibility: (widgetId, info) =>
      set((state) => {
        state.accessibilityMap.set(widgetId, info);
      }),

    removeAccessibility: (widgetId) =>
      set((state) => {
        state.accessibilityMap.delete(widgetId);
      }),

    getAccessibility: (widgetId) => {
      return get().accessibilityMap.get(widgetId);
    },

    // Phase 13: Native overlay nodes for screen reader
    registerNode: (widgetId: string, node: React.ReactNode) =>
      set((state) => {
        state.nodesMap.set(widgetId, node);
      }),

    unregisterNode: (widgetId: string) =>
      set((state) => {
        state.nodesMap.delete(widgetId);
      }),

    getNodes: () => {
      return Array.from(get().nodesMap.values());
    },
  }))
);
