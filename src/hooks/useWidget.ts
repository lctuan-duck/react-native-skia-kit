import { useEffect, useRef } from 'react';
import { useWidgetStore } from '../stores/widgetStore';
import type { LayoutRect } from '../core/types';

let widgetCounter = 0;

function generateWidgetId(type: string): string {
  return `${type}_${++widgetCounter}`;
}

interface UseWidgetOptions {
  type: string;
  layout: LayoutRect;
  parentId?: string;
  props?: Record<string, unknown>;
}

/**
 * Hook to register a widget in the widget tree.
 * Auto-registers on mount, auto-unregisters on unmount.
 *
 * Returns the widget's unique ID.
 */
export function useWidget(options: UseWidgetOptions): string {
  const idRef = useRef<string>(generateWidgetId(options.type));
  const register = useWidgetStore((s) => s.register);
  const unregister = useWidgetStore((s) => s.unregister);
  const updateLayout = useWidgetStore((s) => s.updateLayout);

  const id = idRef.current;

  useEffect(() => {
    register(id, {
      type: options.type,
      layout: options.layout,
      props: options.props ?? {},
      children: [],
      parentId: options.parentId,
    });

    return () => {
      unregister(id);
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layout when props change
  useEffect(() => {
    updateLayout(id, options.layout);
  }, [
    id,
    options.layout.x,
    options.layout.y,
    options.layout.width,
    options.layout.height,
    updateLayout,
  ]);

  return id;
}
