import { useNavStore } from '../stores/navStore';

/**
 * Navigation hook — provides push, pop, replace, and other nav actions.
 * Equivalent to Flutter's Navigator.of(context).
 */
export function useNav() {
  const activeNav = useNavStore((s) => s.activeNav);
  const currentScreenName = useNavStore(
    (s) => s.getCurrentScreenName(activeNav) ?? ''
  );

  return {
    push: (screenName: string, params?: Record<string, unknown>) => {
      useNavStore.getState().pushScreen(activeNav, screenName, params);
    },

    // Alias for push (backward compat)
    pushScreen: (screenName: string, params?: Record<string, unknown>) => {
      useNavStore.getState().pushScreen(activeNav, screenName, params);
    },

    pop: () => {
      useNavStore.getState().popScreen(activeNav);
    },

    // Alias for pop
    popScreen: () => {
      useNavStore.getState().popScreen(activeNav);
    },

    popToRoot: () => {
      useNavStore.getState().popToRoot(activeNav);
    },

    replace: (screenName: string, params?: Record<string, unknown>) => {
      useNavStore.getState().replaceScreen(activeNav, screenName, params);
    },

    switchTo: (screenName: string) => {
      useNavStore.getState().setCurrentScreen(screenName);
    },

    canGoBack: () => {
      const nav = useNavStore.getState().getNav(activeNav);
      return (nav?.navigationStack.length ?? 0) > 1;
    },

    getParams: (): Record<string, unknown> => {
      return useNavStore
        .getState()
        .restoreScreenState(activeNav, currentScreenName);
    },

    // Alias for getParams
    getCurrentParams: (): Record<string, unknown> => {
      return useNavStore
        .getState()
        .restoreScreenState(activeNav, currentScreenName);
    },

    currentScreen: currentScreenName,
  };
}
