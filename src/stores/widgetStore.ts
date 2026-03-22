import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type { WidgetData } from '../core/types';

// ===== Store =====

interface WidgetStoreState {
  widgetMap: Map<string, WidgetData>;

  registerWidget: (widgetInfo: WidgetData) => void;
  unregisterWidget: (widgetId: string) => void;
  updateWidgetState: (
    widgetId: string,
    newState: Record<string, unknown>
  ) => void;
  getWidget: (widgetId: string) => WidgetData | undefined;
  getChildren: (parentId: string) => WidgetData[];
}

export const useWidgetStore = create<WidgetStoreState>()(
  immer((set, get) => ({
    widgetMap: new Map<string, WidgetData>(),

    registerWidget: (widgetInfo) =>
      set((state) => {
        state.widgetMap.set(widgetInfo.id, widgetInfo);

        // Add to parent's children list
        if (widgetInfo.parentId) {
          const parent = state.widgetMap.get(widgetInfo.parentId);
          if (parent && !parent.children.includes(widgetInfo.id)) {
            parent.children.push(widgetInfo.id);
          }
        }
      }),

    unregisterWidget: (widgetId) =>
      set((state) => {
        const widget = state.widgetMap.get(widgetId);
        if (!widget) return;

        // Remove from parent's children list
        if (widget.parentId) {
          const parent = state.widgetMap.get(widget.parentId);
          if (parent) {
            parent.children = parent.children.filter((cid) => cid !== widgetId);
          }
        }

        // Remove all children recursively
        const removeChildren = (parentId: string) => {
          const w = state.widgetMap.get(parentId);
          if (w) {
            for (const childId of w.children) {
              removeChildren(childId);
              state.widgetMap.delete(childId);
            }
          }
        };
        removeChildren(widgetId);

        state.widgetMap.delete(widgetId);
      }),

    updateWidgetState: (widgetId, newState) =>
      set((state) => {
        const widget = state.widgetMap.get(widgetId);
        if (widget) {
          widget.state = newState;
        }
      }),

    getWidget: (widgetId) => {
      return get().widgetMap.get(widgetId);
    },

    getChildren: (parentId) => {
      const state = get();
      const parent = state.widgetMap.get(parentId);
      if (!parent) return [];
      return parent.children
        .map((cid) => state.widgetMap.get(cid))
        .filter(Boolean) as WidgetData[];
    },
  }))
);
