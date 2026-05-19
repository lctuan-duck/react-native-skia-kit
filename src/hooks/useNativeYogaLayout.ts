import * as React from 'react';
import { useMemo } from 'react';
import { useLayoutStore, registerLiveNode, unregisterLiveNode } from '../stores/layoutStore';
import { WidgetContext } from '../core/WidgetContext';
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
type EdgeValue = number | string;
function expandEdges(
  value?: EdgeValue | [EdgeValue, EdgeValue, EdgeValue, EdgeValue],
  horizontal?: EdgeValue,
  vertical?: EdgeValue,
  top?: EdgeValue,
  bottom?: EdgeValue,
  left?: EdgeValue,
  right?: EdgeValue
): {
  top?: EdgeValue;
  right?: EdgeValue;
  bottom?: EdgeValue;
  left?: EdgeValue;
} {
  const result: { top?: EdgeValue; right?: EdgeValue; bottom?: EdgeValue; left?: EdgeValue } = {};
  
  if (value != null) {
    if (Array.isArray(value)) {
      result.top = value[0];
      result.right = value[1];
      result.bottom = value[2];
      result.left = value[3];
    } else {
      result.top = value;
      result.right = value;
      result.bottom = value;
      result.left = value;
    }
  }

  if (vertical != null) {
    result.top = vertical;
    result.bottom = vertical;
  }
  if (horizontal != null) {
    result.right = horizontal;
    result.left = horizontal;
  }
  
  if (top != null) result.top = top;
  if (bottom != null) result.bottom = bottom;
  if (left != null) result.left = left;
  if (right != null) result.right = right;

  return result;
}

/**
 * Build the NativeYogaStyle object from JS component style.
 * Only includes fields that have values (undefined fields are omitted).
 */
function buildNativeStyle(style?: ComponentYogaStyle): NativeYogaStyle {
  if (!style) return {};

  const pad = expandEdges(style.padding, style.paddingHorizontal, style.paddingVertical, style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight);
  const mar = expandEdges(style.margin, style.marginHorizontal, style.marginVertical, style.marginTop, style.marginBottom, style.marginLeft, style.marginRight);

  const result: NativeYogaStyle = {};

  // Container
  if (style.flexDirection != null) result.flexDirection = style.flexDirection;
  if (style.justifyContent != null) result.justifyContent = style.justifyContent;
  if (style.alignItems != null) result.alignItems = style.alignItems;
  if (style.alignContent != null) result.alignContent = style.alignContent;
  if (style.flexWrap != null) result.flexWrap = style.flexWrap;
  if (style.gap != null) result.gap = style.gap;
  if (style.rowGap != null) result.rowGap = style.rowGap;
  if (style.columnGap != null) result.columnGap = style.columnGap;

  // Child
  if (style.flex != null) result.flex = style.flex;
  if (style.flexGrow != null) result.flexGrow = style.flexGrow;
  if (style.flexShrink != null) result.flexShrink = style.flexShrink;
  if (style.flexBasis != null) result.flexBasis = style.flexBasis;
  if (style.alignSelf != null) result.alignSelf = style.alignSelf;

  // Dimensions
  if (style.width != null) result.width = style.width;
  if (style.height != null) result.height = style.height;
  if (style.minWidth != null) result.minWidth = style.minWidth;
  if (style.maxWidth != null) result.maxWidth = style.maxWidth;
  if (style.minHeight != null) result.minHeight = style.minHeight;
  if (style.maxHeight != null) result.maxHeight = style.maxHeight;
  if (style.aspectRatio != null) result.aspectRatio = style.aspectRatio;

  // Layout Rules
  if (style.display != null) result.display = style.display;
  if (style.overflow != null) result.overflow = style.overflow;
  if (style.direction != null) result.direction = style.direction;

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
  _children?: React.ReactNode
): NativeComputedLayout {
  // Build native style — memoize via primitive fields to avoid re-registering every render
  // (object literals like style={{width:100}} create new references each render)
  const nativeStyle = useMemo(
    () => buildNativeStyle(style),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      style?.width, style?.height, style?.minWidth, style?.maxWidth,
      style?.minHeight, style?.maxHeight, style?.flex, style?.flexGrow,
      style?.flexShrink, style?.flexBasis, style?.flexDirection,
      style?.flexWrap, style?.justifyContent, style?.alignItems,
      style?.alignSelf, style?.gap, style?.rowGap, style?.padding,
      style?.margin,
      style?.position, style?.top, style?.left, style?.right, style?.bottom,
      style?.overflow, style?.display, style?.direction, style?.aspectRatio,
    ]
  );

  // Get parent ID from context
  const parentId = React.useContext(WidgetContext);

  // 1. Register Tree Node Structure (mount/unmount)
  React.useLayoutEffect(() => {
    registerLiveNode(widgetId);

    // If we have a parent, append ourselves to its tree!
    if (parentId) {
      useLayoutStore.getState().appendChild(parentId, widgetId);
    }

    return () => {
      unregisterLiveNode(widgetId);
      uiEngine.removeLayoutNode(widgetId);
      if (parentId) {
        useLayoutStore.getState().removeChild(parentId, widgetId);
      }
      // Recalculate layout after removal
      useLayoutStore.getState().triggerLayout();
    };
  }, [widgetId, parentId]);

  // 2. Update Yoga Node Style
  React.useLayoutEffect(() => {
    uiEngine.updateLayoutNode(widgetId, nativeStyle);
    // Recalculate whole layout with updated node styles
    useLayoutStore.getState().triggerLayout();
  }, [widgetId, nativeStyle]);

  // Read layout from Zustand store
  const layout = useLayoutStore((state) => state.layoutMap[widgetId]);

const DEFAULT_RECT = { x: 0, y: 0, width: 0, height: 0 };

  return useMemo(() => {
    if (layout && layout.rect) {
      return layout.rect;
    }
    return DEFAULT_RECT;
  }, [layout]);
}
