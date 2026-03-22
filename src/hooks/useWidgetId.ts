import { useRef } from 'react';

let _counter = 0;

/**
 * Generate a unique, stable widget ID for a component instance.
 * ID is created once and persists across re-renders via useRef.
 *
 * @param prefix - Optional prefix (e.g., component type name)
 * @returns Stable unique string ID
 */
export function useWidgetId(prefix = 'w'): string {
  const idRef = useRef<string | null>(null);
  if (idRef.current === null) {
    idRef.current = `${prefix}_${++_counter}`;
  }
  return idRef.current;
}
