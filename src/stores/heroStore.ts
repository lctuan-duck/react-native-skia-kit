import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';

// ===== Types =====

export interface HeroData {
  tag: string;
  rect: { x: number; y: number; width: number; height: number };
  widgetSnapshot?: unknown; // SkImage — snapshot for animation
}

interface HeroStoreState {
  heroMap: Map<string, HeroData>;
  isTransitioning: boolean;

  registerHero: (tag: string, heroData: HeroData) => void;
  unregisterHero: (tag: string) => void;
  startTransition: () => void;
  endTransition: () => void;
  getHero: (tag: string) => HeroData | undefined;
}

export const useHeroStore = create<HeroStoreState>()(
  immer((set, get) => ({
    heroMap: new Map<string, HeroData>(),
    isTransitioning: false,

    registerHero: (tag, heroData) =>
      set((state) => {
        state.heroMap.set(tag, heroData);
      }),

    unregisterHero: (tag) =>
      set((state) => {
        state.heroMap.delete(tag);
      }),

    startTransition: () =>
      set((state) => {
        state.isTransitioning = true;
      }),

    endTransition: () =>
      set((state) => {
        state.isTransitioning = false;
      }),

    getHero: (tag) => {
      return get().heroMap.get(tag);
    },
  }))
);
