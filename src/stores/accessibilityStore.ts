import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type { AccessibilityRole } from 'react-native';

// Defined locally to avoid circular dependency with ../core/Accessibility
export interface AccessibilityNode {
  widgetId: string;
  label: string;
  role: AccessibilityRole;
  hint?: string;
  value?: { min?: number; max?: number; now?: number; text?: string };
  rect: { x: number; y: number; width: number; height: number };
  onPress?: () => void;
}

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
  nodesMap: Map<string, AccessibilityNode>;

  setFocus: (widgetId: string | null) => void;
  setAccessibility: (widgetId: string, info: AccessibilityInfo) => void;
  removeAccessibility: (widgetId: string) => void;
  getAccessibility: (widgetId: string) => AccessibilityInfo | undefined;

  // Phase 13: Native overlay nodes
  registerNode: (widgetId: string, node: AccessibilityNode) => void;
  unregisterNode: (widgetId: string) => void;
  getNodes: () => AccessibilityNode[];
}

export const useAccessibilityStore = create<AccessibilityStoreState>()(
  immer((set, get) => ({
    focusWidgetId: null,
    accessibilityMap: new Map<string, AccessibilityInfo>(),
    nodesMap: new Map<string, AccessibilityNode>(),

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
    registerNode: (widgetId: string, node: AccessibilityNode) =>
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
