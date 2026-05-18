import * as React from 'react';
import { useMemo } from 'react';
import { useLayoutStore } from '../stores/layoutStore';
import { uiEngine } from '../core/GlobalEngine';
import type { NativeYogaStyle } from '../nitro/UIEngine.nitro';
import type {
  FlexChildStyle,
  FlexContainerStyle,
  LayoutStyle,
  SpacingStyle,
} from '../types/style.types';

/**
 * JS-side style type that components pass in.
 * Supports both shorthand (padding: number) and per-edge values.
 */
export type ComponentYogaStyle = FlexChildStyle &
  FlexContainerStyle &
  LayoutStyle &
  SpacingStyle;

export interface NativeComputedLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Expand shorthand padding/margin into per-edge values for C++.
 */
function expandEdges(
  value?: number | [number, number, number, number]
): {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
} {
  if (value == null) return {};
  if (Array.isArray(value)) {
    return { top: value[0], right: value[1], bottom: value[2], left: value[3] };
  }
  return { top: value, right: value, bottom: value, left: value };
}

/**
 * Build the NativeYogaStyle object from JS component style.
 * Only includes fields that have values (undefined fields are omitted).
 */
function buildNativeStyle(style?: ComponentYogaStyle): NativeYogaStyle {
  if (!style) return {};

  const pad = expandEdges(style.padding);
  const mar = expandEdges(style.margin);

  const result: NativeYogaStyle = {};

  // Container
  if (style.flexDirection != null) result.flexDirection = style.flexDirection;
  if (style.justifyContent != null) result.justifyContent = style.justifyContent;
  if (style.alignItems != null) result.alignItems = style.alignItems;
  if (style.flexWrap != null) result.flexWrap = style.flexWrap;
  if (style.gap != null) result.gap = style.gap;
  if (style.rowGap != null) result.rowGap = style.rowGap;

  // Child
  if (style.flex != null) result.flex = style.flex;
  if (style.flexGrow != null) result.flexGrow = style.flexGrow;
  if (style.flexShrink != null) result.flexShrink = style.flexShrink;
  if (style.flexBasis != null && style.flexBasis !== 'auto') {
    result.flexBasis = style.flexBasis as number;
  }
  if (style.alignSelf != null) result.alignSelf = style.alignSelf;

  // Dimensions
  if (style.width != null) result.width = style.width;
  if (style.height != null) result.height = style.height;

  // Padding
  if (pad.top != null) result.paddingTop = pad.top;
  if (pad.right != null) result.paddingRight = pad.right;
  if (pad.bottom != null) result.paddingBottom = pad.bottom;
  if (pad.left != null) result.paddingLeft = pad.left;

  // Margin
  if (mar.top != null) result.marginTop = mar.top;
  if (mar.right != null) result.marginRight = mar.right;
  if (mar.bottom != null) result.marginBottom = mar.bottom;
  if (mar.left != null) result.marginLeft = mar.left;

  // Position
  if (style.position != null) result.position = style.position;
  if (style.top != null) result.top = style.top;
  if (style.left != null) result.left = style.left;
  if (style.right != null) result.right = style.right;
  if (style.bottom != null) result.bottom = style.bottom;

  return result;
}

export function useNativeYogaLayout(
  widgetId: string,
  style?: ComponentYogaStyle,
  children?: React.ReactNode
): NativeComputedLayout {
  // Build native style object (only includes defined properties)
  const nativeStyle = useMemo(() => buildNativeStyle(style), [style]);

  // Register node with C++ Engine
  React.useLayoutEffect(() => {
    uiEngine.updateLayoutNode(widgetId, nativeStyle);

    return () => {
      uiEngine.removeLayoutNode(widgetId);
    };
  }, [widgetId, nativeStyle]);

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

  // Read layout from Zustand store
  const layout = useLayoutStore((state) => state.layoutMap.get(widgetId));

  return useMemo(() => {
    if (layout && layout.rect) {
      return layout.rect;
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }, [layout]);
}
