import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { uiEngine } from '../core/GlobalEngine';
import './setup';
import type {
  HitTestBehavior,
  GestureCallbacks,
  PanEvent,
} from '../types/widget.types';

// ===== Types =====

export type { HitTestBehavior, PanEvent };

export interface HitRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface HitEntry {
  widgetId: string;
  parentId: string | null;
  rect: HitRect;
  zIndex: number;
  hitTestBehavior: HitTestBehavior;
  callbacks: GestureCallbacks;
}


// ===== Scroll Offset Entry =====

export interface ScrollArea {
  /** Viewport rect of the ScrollView */
  rect: HitRect;
  /** Current scroll offset (pixels scrolled) */
  offset: number;
  /** Scroll direction */
  horizontal: boolean;
}

// ===== Store =====

interface EventStoreState {
  hitMaps: Map<string, Map<string, HitEntry>>;
  /** Scroll areas: widgetId → ScrollArea */
  scrollAreas: Map<string, ScrollArea>;

  registerHit: (canvasId: string, widgetId: string, hitEntry: HitEntry) => void;
  unregisterHit: (canvasId: string, widgetId: string) => void;
  clearHitMap: (canvasId: string) => void;

  // Scroll area registration
  registerScrollArea: (widgetId: string, area: ScrollArea) => void;
  unregisterScrollArea: (widgetId: string) => void;
  updateScrollOffset: (widgetId: string, offset: number) => void;

}

export interface HitResult {
  entry: HitEntry;
  localX: number;
  localY: number;
}

export const useEventStore = create<EventStoreState>()(
  immer((set) => ({
    hitMaps: new Map<string, Map<string, HitEntry>>(),
    scrollAreas: new Map<string, ScrollArea>(),

    registerHit: (canvasId, widgetId, hitEntry) => {
      set((state) => {
        if (!state.hitMaps.has(canvasId)) {
          state.hitMaps.set(canvasId, new Map());
        }
        state.hitMaps.get(canvasId)!.set(widgetId, hitEntry);
      });
      // Sync to C++ Engine
      let behaviorValue = 0;
      if (hitEntry.hitTestBehavior === 'opaque') behaviorValue = 1;
      else if (hitEntry.hitTestBehavior === 'translucent') behaviorValue = 2;

      const { left, top, width, height } = hitEntry.rect;
      uiEngine.registerWidget(
        widgetId,
        left,
        top,
        width,
        height,
        hitEntry.zIndex,
        behaviorValue
      );
    },

    unregisterHit: (canvasId, widgetId) => {
      set((state) => {
        const hitMap = state.hitMaps.get(canvasId);
        if (hitMap) hitMap.delete(widgetId);
      });
      // Sync to C++ Engine
      uiEngine.unregisterWidget(widgetId);
    },

    clearHitMap: (canvasId) => {
      set((state) => {
        state.hitMaps.delete(canvasId);
      });
      // Sync to C++ Engine
      uiEngine.clear();
    },

    registerScrollArea: (widgetId, area) => {
      set((state) => {
        state.scrollAreas.set(widgetId, area);
      });
      // Sync to C++ Engine
      uiEngine.registerScrollArea(
        widgetId,
        area.rect.left,
        area.rect.top,
        area.rect.width,
        area.rect.height,
        area.horizontal
      );
    },

    unregisterScrollArea: (widgetId) => {
      set((state) => {
        state.scrollAreas.delete(widgetId);
      });
      // Sync to C++ Engine
      uiEngine.unregisterScrollArea(widgetId);
    },

    updateScrollOffset: (widgetId, offset) => {
      set((state) => {
        const area = state.scrollAreas.get(widgetId);
        if (area) area.offset = offset;
      });
      // Sync to C++ Engine
      uiEngine.updateScrollOffset(widgetId, offset);
    },

  }))
);

