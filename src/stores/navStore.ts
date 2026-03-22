import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import './setup';

// ===== Types =====

export interface NavObject {
  navigationStack: string[];
  screenMap: Map<string, unknown>;
  stateMap: Map<string, Record<string, unknown>>;
  layoutMap?: Map<string, unknown>;
}

interface NavStoreState {
  navMaps: Map<string, NavObject>;
  activeNav: string;
  currentUrl: string;
  router: unknown;
  screensMap: Record<string, unknown>;

  setActiveNav: (navId: string) => void;

  pushScreen: (
    navId: string,
    screenName: string,
    params?: Record<string, unknown>
  ) => void;
  popScreen: (navId: string) => void;
  popToRoot: (navId: string) => void;
  replaceScreen: (
    navId: string,
    screenName: string,
    params?: Record<string, unknown>
  ) => void;

  saveScreenState: (
    navId: string,
    screenName: string,
    stateObj: Record<string, unknown>
  ) => void;
  restoreScreenState: (
    navId: string,
    screenName: string
  ) => Record<string, unknown>;

  setCurrentUrl: (url: string) => void;
  setCurrentScreen: (screenName: string) => void;

  // Doc actions
  setNavMap: (navId: string, navObj: NavObject) => void;
  setNavLayoutMap: (navId: string, layoutMap: Map<string, unknown>) => void;
  setRouter: (router: unknown) => void;
  setScreens: (screensMap: Record<string, unknown>) => void;

  // Helpers
  getNav: (navId: string) => NavObject | undefined;
  getCurrentScreenName: (navId: string) => string | undefined;
}

function createNavObject(): NavObject {
  return {
    navigationStack: [],
    screenMap: new Map(),
    stateMap: new Map(),
  };
}

export const useNavStore = create<NavStoreState>()(
  immer((set, get) => ({
    navMaps: new Map<string, NavObject>(),
    activeNav: 'main',
    currentUrl: '',
    router: null,
    screensMap: {},

    setActiveNav: (navId) =>
      set((state) => {
        state.activeNav = navId;
      }),

    pushScreen: (navId, screenName, params) =>
      set((state) => {
        if (!state.navMaps.has(navId)) {
          state.navMaps.set(navId, createNavObject());
        }
        const nav = state.navMaps.get(navId)!;
        nav.navigationStack.push(screenName);
        if (params) {
          nav.stateMap.set(screenName, params);
        }
      }),

    popScreen: (navId) =>
      set((state) => {
        const nav = state.navMaps.get(navId);
        if (nav && nav.navigationStack.length > 1) {
          nav.navigationStack.pop();
        }
      }),

    popToRoot: (navId) =>
      set((state) => {
        const nav = state.navMaps.get(navId);
        if (nav && nav.navigationStack.length > 1) {
          const root = nav.navigationStack[0]!;
          nav.navigationStack = [root];
        }
      }),

    replaceScreen: (navId, screenName, params) =>
      set((state) => {
        if (!state.navMaps.has(navId)) {
          state.navMaps.set(navId, createNavObject());
        }
        const nav = state.navMaps.get(navId)!;
        if (nav.navigationStack.length > 0) {
          nav.navigationStack.pop();
        }
        nav.navigationStack.push(screenName);
        if (params) {
          nav.stateMap.set(screenName, params);
        }
      }),

    saveScreenState: (navId, screenName, stateObj) =>
      set((state) => {
        if (!state.navMaps.has(navId)) {
          state.navMaps.set(navId, createNavObject());
        }
        state.navMaps.get(navId)!.stateMap.set(screenName, stateObj);
      }),

    restoreScreenState: (navId, screenName) => {
      const nav = get().navMaps.get(navId);
      return nav?.stateMap?.get(screenName) ?? {};
    },

    setCurrentUrl: (url) =>
      set((state) => {
        state.currentUrl = url;
      }),

    setCurrentScreen: (screenName) =>
      set((state) => {
        const navId = state.activeNav;
        if (!state.navMaps.has(navId)) {
          state.navMaps.set(navId, createNavObject());
        }
        state.navMaps.get(navId)!.navigationStack = [screenName];
      }),

    setNavMap: (navId, navObj) =>
      set((state) => {
        state.navMaps.set(navId, navObj);
      }),

    setNavLayoutMap: (navId, layoutMap) =>
      set((state) => {
        const nav = state.navMaps.get(navId);
        if (nav) {
          nav.layoutMap = layoutMap;
        }
      }),

    setRouter: (router) =>
      set((state) => {
        state.router = router;
      }),

    setScreens: (screensMap) =>
      set((state) => {
        state.screensMap = screensMap;
      }),

    getNav: (navId) => {
      return get().navMaps.get(navId);
    },

    getCurrentScreenName: (navId) => {
      const nav = get().navMaps.get(navId);
      if (!nav || nav.navigationStack.length === 0) return undefined;
      return nav.navigationStack[nav.navigationStack.length - 1];
    },
  }))
);
