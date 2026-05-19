import { createContext } from 'react';

/**
 * Provides the parent widget ID to child widgets.
 * This is used to dynamically construct the Yoga layout tree.
 */
export const WidgetContext = createContext<string | null>(null);
