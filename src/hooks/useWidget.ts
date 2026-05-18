import { useEffect } from 'react';
import { useWidgetId } from './useWidgetId';
import { useLayoutStore } from '../stores/layoutStore';
import type { LayoutRect } from '../types/widget.types';

interface UseWidgetOptions {
  type: string;
  layout: LayoutRect;
  parentId?: string;
}

/**
 * Hook to register a widget in the layout store.
 * Auto-registers on mount, auto-unregisters on unmount.
 * Uses useWidgetId() for stable, unique IDs.
 * Returns the widget's unique ID.
 */
export function useWidget(options: UseWidgetOptions): string {
  const widgetId = useWidgetId(options.type);

  useEffect(() => {
    useLayoutStore.getState().setLayout(widgetId, options.layout);

    return () => {
      useLayoutStore.getState().removeLayout(widgetId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId]);

  // Update layout when position/size changes
  useEffect(() => {
    useLayoutStore.getState().setLayout(widgetId, options.layout);
  }, [
    widgetId,
    options.layout.x,
    options.layout.y,
    options.layout.width,
    options.layout.height,
  ]);

  return widgetId;
}
