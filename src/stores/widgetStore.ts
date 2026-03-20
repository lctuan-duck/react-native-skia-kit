import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { WidgetData, LayoutRect } from '../core/types';

enableMapSet();

// ===== Store =====

interface WidgetStoreState {
  widgets: Map<string, WidgetData>;

  register: (id: string, data: Omit<WidgetData, 'id'>) => void;
  unregister: (id: string) => void;
  updateLayout: (id: string, layout: LayoutRect) => void;
  getWidget: (id: string) => WidgetData | undefined;
  getChildren: (parentId: string) => WidgetData[];
}

export const useWidgetStore = create<WidgetStoreState>()(
  immer((set, get) => ({
    widgets: new Map<string, WidgetData>(),

    register: (id, data) =>
      set((state) => {
        state.widgets.set(id, { ...data, id });

        // Add to parent's children list
        if (data.parentId) {
          const parent = state.widgets.get(data.parentId);
          if (parent && !parent.children.includes(id)) {
            parent.children.push(id);
          }
        }
      }),

    unregister: (id) =>
      set((state) => {
        const widget = state.widgets.get(id);
        if (!widget) return;

        // Remove from parent's children list
        if (widget.parentId) {
          const parent = state.widgets.get(widget.parentId);
          if (parent) {
            parent.children = parent.children.filter((cid) => cid !== id);
          }
        }

        // Remove all children recursively
        const removeChildren = (parentId: string) => {
          const w = state.widgets.get(parentId);
          if (w) {
            for (const childId of w.children) {
              removeChildren(childId);
              state.widgets.delete(childId);
            }
          }
        };
        removeChildren(id);

        state.widgets.delete(id);
      }),

    updateLayout: (id, layout) =>
      set((state) => {
        const widget = state.widgets.get(id);
        if (widget) {
          widget.layout = layout;
        }
      }),

    getWidget: (id) => {
      return get().widgets.get(id);
    },

    getChildren: (parentId) => {
      const state = get();
      const parent = state.widgets.get(parentId);
      if (!parent) return [];
      return parent.children
        .map((cid) => state.widgets.get(cid))
        .filter(Boolean) as WidgetData[];
    },
  }))
);
