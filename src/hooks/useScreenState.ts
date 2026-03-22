/**
 * useScreenState — Save and restore screen state across navigation.
 * Phase 11: State Restoration for Navigation.
 *
 * Equivalent to Flutter's AutomaticKeepAliveClientMixin + RestorationMixin.
 *
 * Automatically saves state (scroll position, form values, etc.) when
 * navigating away and restores it when returning to the screen.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavStore } from '../stores/navStore';

/**
 * Hook to persist and restore screen-specific state across navigation.
 *
 * @param screenName - The screen name to associate state with
 * @param initialState - Default state when no saved state exists
 * @returns [state, setState] tuple — state is restored on mount, saved on unmount
 *
 * @example
 * function OrderScreen() {
 *   const [state, setState] = useScreenState('order', {
 *     scrollOffset: 0,
 *     selectedCategory: 'all',
 *     searchText: '',
 *   });
 *
 *   // state.scrollOffset is restored when navigating back
 *   // Call setState({ scrollOffset: 100 }) to update
 * }
 */
export function useScreenState<T extends Record<string, unknown>>(
  screenName: string,
  initialState: T
): [T, (partial: Partial<T>) => void] {
  const navId = useNavStore((s) => s.activeNav);
  const stateRef = useRef<T>(initialState);

  // Restore state on mount
  useEffect(() => {
    const saved = useNavStore.getState().restoreScreenState(navId, screenName);
    if (saved && Object.keys(saved).length > 0) {
      stateRef.current = { ...initialState, ...saved } as T;
    }
  }, [navId, screenName]);

  // Save state on unmount
  useEffect(() => {
    return () => {
      useNavStore
        .getState()
        .saveScreenState(navId, screenName, stateRef.current);
    };
  }, [navId, screenName]);

  const setState = useCallback(
    (partial: Partial<T>) => {
      stateRef.current = { ...stateRef.current, ...partial };
      // Also save immediately to store
      useNavStore
        .getState()
        .saveScreenState(navId, screenName, stateRef.current);
    },
    [navId, screenName]
  );

  return [stateRef.current, setState];
}
