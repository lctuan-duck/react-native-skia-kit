import { useEffect } from 'react';
import { useWidgetId } from './useWidgetId';
import { useWidgetStore } from '../stores/widgetStore';
import { useLayoutStore } from '../stores/layoutStore';
import type { LayoutRect } from '../types/widget.types';

interface UseWidgetOptions<P = Record<string, unknown>> {
  type: string;
  layout: LayoutRect;
  parentId?: string;
  props?: P;
}

/**
 * Hook to register a widget in the widget tree.
 * Auto-registers on mount in BOTH widgetStore and layoutStore.
 * Auto-unregisters on unmount from both stores.
 *
 * Uses useWidgetId() for stable, unique IDs.
 *
 * Returns the widget's unique ID.
 */
export function useWidget<P = Record<string, unknown>>(
  options: UseWidgetOptions<P>
): string {
  const widgetId = useWidgetId(options.type);

  useEffect(() => {
    // Register widget in widgetStore
    useWidgetStore.getState().registerWidget({
      id: widgetId,
      type: options.type,
      props: (options.props as Record<string, unknown>) ?? {},
      state: {},
      parentId: options.parentId ?? undefined,
      children: [],
      layout: options.layout,
    });

    // Register layout in layoutStore
    useLayoutStore.getState().setLayout(widgetId, options.layout);

    // Cleanup on unmount
    return () => {
      useWidgetStore.getState().unregisterWidget(widgetId);
      useLayoutStore.getState().removeLayout(widgetId);
    };
  }, [widgetId]);

  // Update layout when position/size changes
  useEffect(() => {
    useLayoutStore.getState().setLayout(widgetId, options.layout);
  }, [
    options.layout.x,
    options.layout.y,
    options.layout.width,
    options.layout.height,
  ]);

  return widgetId;
}
