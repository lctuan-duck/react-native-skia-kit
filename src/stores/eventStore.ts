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

  // Hit test: find all widgets at (x, y) for a given canvas
  hitTest: (canvasId: string, x: number, y: number) => HitResult[];
}

export interface HitResult {
  entry: HitEntry;
  localX: number;
  localY: number;
}

export const useEventStore = create<EventStoreState>()(
  immer((set, get) => ({
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
      // Cannot fully unregister scroll area in MVP C++ right now, but we can reset offset
      uiEngine.updateScrollOffset(widgetId, 0);
    },

    updateScrollOffset: (widgetId, offset) => {
      set((state) => {
        const area = state.scrollAreas.get(widgetId);
        if (area) area.offset = offset;
      });
      // Sync to C++ Engine
      uiEngine.updateScrollOffset(widgetId, offset);
    },

    hitTest: (canvasId, x, y) => {
      const state = get();
      // ... existing JS hitTest logic for fallback ...
      const hitMap = state.hitMaps.get(canvasId);
      if (!hitMap) return [];

      // Calculate scroll-adjusted coordinates
      // If (x,y) falls inside a scroll area, shift coordinates by scroll offset
      let adjustedX = x;
      let adjustedY = y;
      for (const [, scrollArea] of state.scrollAreas) {
        const { rect, offset, horizontal } = scrollArea;
        if (
          x >= rect.left &&
          x <= rect.left + rect.width &&
          y >= rect.top &&
          y <= rect.top + rect.height
        ) {
          if (horizontal) {
            adjustedX += offset;
          } else {
            adjustedY += offset;
          }
        }
      }

      const hitWidgets: HitResult[] = [];
      for (const [, entry] of hitMap) {
        const { left, top, width, height } = entry.rect;
        if (
          adjustedX >= left &&
          adjustedX <= left + width &&
          adjustedY >= top &&
          adjustedY <= top + height
        ) {
          hitWidgets.push({
            entry,
            localX: adjustedX - left,
            localY: adjustedY - top,
          });
        }
      }

      // Sort by zIndex descending (topmost first)
      hitWidgets.sort((a, b) => b.entry.zIndex - a.entry.zIndex);

      // Apply HitTestBehavior
      const eventReceivers: HitResult[] = [];
      for (const result of hitWidgets) {
        eventReceivers.push(result);
        if (result.entry.hitTestBehavior === 'opaque') {
          break;
        }
      }

      return eventReceivers;
    },
  }))
);

