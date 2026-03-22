import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';
import type {
  HitTestBehavior,
  GestureCallbacks,
  PanEvent,
} from '../core/types';

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

// ===== Gesture Arena =====

export type GestureDisposition = 'accepted' | 'rejected';

export interface GestureArenaMember {
  acceptGesture(pointerId: number): void;
  rejectGesture(pointerId: number): void;
}

export class GestureArenaManager {
  private arenas: Map<number, GestureArenaMember[]> = new Map();

  add(pointerId: number, member: GestureArenaMember) {
    if (!this.arenas.has(pointerId)) {
      this.arenas.set(pointerId, []);
    }
    this.arenas.get(pointerId)!.push(member);
  }

  resolve(
    pointerId: number,
    member: GestureArenaMember,
    disposition: GestureDisposition
  ) {
    const members = this.arenas.get(pointerId);
    if (!members) return;

    if (disposition === 'accepted') {
      for (const other of members) {
        if (other !== member) other.rejectGesture(pointerId);
      }
      member.acceptGesture(pointerId);
      this.arenas.delete(pointerId);
    } else {
      const filtered = members.filter((m) => m !== member);
      if (filtered.length === 1) {
        filtered[0]!.acceptGesture(pointerId);
        this.arenas.delete(pointerId);
      } else {
        this.arenas.set(pointerId, filtered);
      }
    }
  }

  close(pointerId: number) {
    const members = this.arenas.get(pointerId);
    if (!members || members.length === 0) return;
    members[0]!.acceptGesture(pointerId);
    for (let i = 1; i < members.length; i++) {
      members[i]!.rejectGesture(pointerId);
    }
    this.arenas.delete(pointerId);
  }
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
  gestureArena: GestureArenaManager;
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
  hitTest: (canvasId: string, x: number, y: number) => HitEntry[];
}

export const useEventStore = create<EventStoreState>()(
  immer((set, get) => ({
    hitMaps: new Map<string, Map<string, HitEntry>>(),
    gestureArena: new GestureArenaManager(),
    scrollAreas: new Map<string, ScrollArea>(),

    registerHit: (canvasId, widgetId, hitEntry) =>
      set((state) => {
        if (!state.hitMaps.has(canvasId)) {
          state.hitMaps.set(canvasId, new Map());
        }
        state.hitMaps.get(canvasId)!.set(widgetId, hitEntry);
      }),

    unregisterHit: (canvasId, widgetId) =>
      set((state) => {
        const hitMap = state.hitMaps.get(canvasId);
        if (hitMap) hitMap.delete(widgetId);
      }),

    clearHitMap: (canvasId) =>
      set((state) => {
        state.hitMaps.delete(canvasId);
      }),

    registerScrollArea: (widgetId, area) =>
      set((state) => {
        state.scrollAreas.set(widgetId, area);
      }),

    unregisterScrollArea: (widgetId) =>
      set((state) => {
        state.scrollAreas.delete(widgetId);
      }),

    updateScrollOffset: (widgetId, offset) =>
      set((state) => {
        const area = state.scrollAreas.get(widgetId);
        if (area) area.offset = offset;
      }),

    hitTest: (canvasId, x, y) => {
      const state = get();
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

      const hitWidgets: HitEntry[] = [];
      for (const [, entry] of hitMap) {
        const { left, top, width, height } = entry.rect;
        if (
          adjustedX >= left &&
          adjustedX <= left + width &&
          adjustedY >= top &&
          adjustedY <= top + height
        ) {
          hitWidgets.push(entry);
        }
      }

      // Sort by zIndex descending (topmost first)
      hitWidgets.sort((a, b) => b.zIndex - a.zIndex);

      // Apply HitTestBehavior
      const eventReceivers: HitEntry[] = [];
      for (const widget of hitWidgets) {
        eventReceivers.push(widget);
        if (widget.hitTestBehavior === 'opaque') {
          break;
        }
      }

      return eventReceivers;
    },
  }))
);

// ===== Touch handler =====

export function handleTouch(canvasId: string, x: number, y: number) {
  const receivers = useEventStore.getState().hitTest(canvasId, x, y);
  for (const widget of receivers) {
    widget.callbacks.onPress?.();
  }
}
