import * as React from 'react';
import { useMemo } from 'react';
import { useLayoutStore } from '../stores/layoutStore';
import { uiEngine } from '../core/GlobalEngine';
import type {
  FlexChildStyle,
  FlexContainerStyle,
  LayoutStyle,
  SpacingStyle,
} from '../types/style.types';

export type NativeYogaStyle = FlexChildStyle &
  FlexContainerStyle &
  LayoutStyle &
  SpacingStyle;

export interface NativeComputedLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useNativeYogaLayout(
  widgetId: string,
  style?: NativeYogaStyle,
  children?: React.ReactNode
): NativeComputedLayout {
  // Register node with C++ Engine SYNCHRONOUSLY
  uiEngine.updateLayoutNode(
    widgetId,
    style?.flexDirection || 'column',
    style?.justifyContent || 'flex-start',
    style?.alignItems || 'stretch',
    style?.flexWrap || 'nowrap',
    style?.width ?? -1,
    style?.height ?? -1,
    style?.flex ?? 0,
    style?.gap ?? 0,
    Array.isArray(style?.padding) ? style.padding[0] : style?.padding ?? -1,
    Array.isArray(style?.padding) ? style.padding[1] : style?.padding ?? -1,
    Array.isArray(style?.padding) ? style.padding[2] : style?.padding ?? -1,
    Array.isArray(style?.padding) ? style.padding[3] : style?.padding ?? -1
  );

  // Parse children IDs
  const childIds: string[] = [];
  React.Children.forEach(children, (child) => {
    if (
      React.isValidElement(child) &&
      child.props &&
      typeof child.props === 'object' &&
      'id' in child.props
    ) {
      childIds.push((child.props as any).id);
    }
  });

  uiEngine.setChildren(widgetId, childIds);

  // Read layout from Zustand store. This store will be updated by CanvasRoot after it triggers calculateLayout.
  const layout = useLayoutStore((state) => state.layoutMap.get(widgetId));

  return useMemo(() => {
    if (layout && layout.rect) {
      return layout.rect;
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }, [layout]);
}
