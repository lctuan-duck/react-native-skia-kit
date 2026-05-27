import { createContext, useContext } from 'react';

/**
 * Provides the parent widget ID to child widgets.
 * This is used to dynamically construct the Yoga layout tree.
 */
export const WidgetContext = createContext<string | null>(null);

/**
 * useCanvasId — lấy canvasId của CanvasRoot gần nhất.
 * Dùng bởi PopupMenuButton, DropdownButton để scope overlay vào đúng canvas.
 */
export function useCanvasId(): string {
  return useContext(WidgetContext) ?? 'main';
}
