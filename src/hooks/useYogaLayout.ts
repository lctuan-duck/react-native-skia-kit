import * as React from 'react';
import { useMemo, useEffect } from 'react';
import type { WidgetProps } from '../core/types';

// ===== Types =====

export interface YogaFlexProps {
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap';
  justifyContent?:
    | 'start'
    | 'center'
    | 'end'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
  rowGap?: number;
  padding?: number | [number, number, number, number];
}

export interface ComputedLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ContainerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ===== Pure JS Flex Layout Engine =====
// Replaces Yoga with a lightweight JS implementation for basic flex layout.
// Supports: flexDirection, justifyContent, alignItems, gap, padding, wrap.

function parsePadding(
  padding: number | [number, number, number, number] | undefined
): { top: number; right: number; bottom: number; left: number } {
  if (padding == null) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (typeof padding === 'number')
    return { top: padding, right: padding, bottom: padding, left: padding };
  return {
    top: padding[0],
    right: padding[1],
    bottom: padding[2],
    left: padding[3],
  };
}

interface ChildInfo {
  width: number | undefined;
  height: number | undefined;
  flex: number | undefined;
  flexGrow: number | undefined;
  alignSelf: string | undefined;
  position: string | undefined; // 'absolute' | 'relative'
  top: number | undefined;
  left: number | undefined;
  right: number | undefined;
  bottom: number | undefined;
}

function extractChildInfo(child: React.ReactElement): ChildInfo {
  const p = child.props as WidgetProps;
  return {
    width: p.width,
    height: p.height,
    flex: p.flex,
    flexGrow: p.flexGrow,
    alignSelf: p.alignSelf,
    position: p.position,
    top: p.top,
    left: p.left,
    right: p.right,
    bottom: p.bottom,
  };
}

function calculateFlexLayout(
  container: ContainerRect,
  flexProps: YogaFlexProps,
  children: ChildInfo[]
): ComputedLayout[] {
  const pad = parsePadding(flexProps.padding);
  const isRow = flexProps.flexDirection === 'row';
  const gap = flexProps.gap ?? 0;
  const rGap = flexProps.rowGap ?? gap;
  const shouldWrap = flexProps.flexWrap === 'wrap';

  const innerW = container.width - pad.left - pad.right;
  const innerH = container.height - pad.top - pad.bottom;

  const results: ComputedLayout[] = [];

  // Separate absolute and relative children
  const relativeIndices: number[] = [];
  children.forEach((child, i) => {
    if (child.position === 'absolute') {
      results[i] = {
        x: container.x + pad.left + (child.left ?? 0),
        y: container.y + pad.top + (child.top ?? 0),
        width: child.width ?? innerW,
        height: child.height ?? innerH,
      };
    } else {
      relativeIndices.push(i);
      results[i] = { x: 0, y: 0, width: 0, height: 0 };
    }
  });

  if (relativeIndices.length === 0) return results;

  const mainAxis = isRow ? innerW : innerH;
  const crossAxis = isRow ? innerH : innerW;
  const ai = flexProps.alignItems ?? (isRow ? 'center' : 'start');

  // Pre-calculate child sizes
  const childMainSizes: number[] = [];
  const childCrossSizes: number[] = [];

  for (const idx of relativeIndices) {
    const child = children[idx]!;
    const mainSize = isRow ? child.width : child.height;
    const crossSize = isRow ? child.height : child.width;
    const defaultMain = isRow ? 50 : 40;
    childMainSizes[idx] = mainSize ?? defaultMain;
    childCrossSizes[idx] = crossSize ?? (isRow ? 40 : 50);
  }

  // ===== WRAP MODE =====
  if (shouldWrap) {
    // Split into lines
    type FlexLine = { indices: number[]; mainUsed: number; maxCross: number };
    const lines: FlexLine[] = [];
    let currentLine: FlexLine = { indices: [], mainUsed: 0, maxCross: 0 };

    for (const idx of relativeIndices) {
      const mSize = childMainSizes[idx]!;
      const cSize = childCrossSizes[idx]!;
      const gapBefore = currentLine.indices.length > 0 ? gap : 0;

      if (
        currentLine.indices.length > 0 &&
        currentLine.mainUsed + gapBefore + mSize > mainAxis
      ) {
        // Wrap to next line
        lines.push(currentLine);
        currentLine = { indices: [idx], mainUsed: mSize, maxCross: cSize };
      } else {
        currentLine.indices.push(idx);
        currentLine.mainUsed += gapBefore + mSize;
        currentLine.maxCross = Math.max(currentLine.maxCross, cSize);
      }
    }
    if (currentLine.indices.length > 0) lines.push(currentLine);

    // Position each line
    let crossCursor = 0;

    for (const line of lines) {
      const lineCross = line.maxCross;
      const freeMain = mainAxis - line.mainUsed;

      // justifyContent for this line
      let mainCursor = 0;
      let lineExtraGap = 0;
      const jc = flexProps.justifyContent ?? 'start';

      switch (jc) {
        case 'center':
          mainCursor = freeMain / 2;
          break;
        case 'end':
          mainCursor = freeMain;
          break;
        case 'spaceBetween':
          if (line.indices.length > 1)
            lineExtraGap = freeMain / (line.indices.length - 1);
          break;
        case 'spaceAround':
          if (line.indices.length > 0) {
            const sp = freeMain / line.indices.length;
            mainCursor = sp / 2;
            lineExtraGap = sp;
          }
          break;
        case 'spaceEvenly':
          if (line.indices.length > 0) {
            const sp = freeMain / (line.indices.length + 1);
            mainCursor = sp;
            lineExtraGap = sp;
          }
          break;
        default:
          break;
      }

      for (let li = 0; li < line.indices.length; li++) {
        const idx = line.indices[li]!;
        const mSize = childMainSizes[idx]!;
        const cSize = childCrossSizes[idx]!;

        // Cross-axis alignment within line
        const align = children[idx]!.alignSelf ?? ai;
        const actualCross = align === 'stretch' ? lineCross : cSize;
        let crossOffset = 0;
        switch (align) {
          case 'center':
            crossOffset = (lineCross - actualCross) / 2;
            break;
          case 'end':
            crossOffset = lineCross - actualCross;
            break;
          default:
            crossOffset = 0;
            break;
        }

        if (isRow) {
          results[idx] = {
            x: container.x + pad.left + mainCursor,
            y: container.y + pad.top + crossCursor + crossOffset,
            width: mSize,
            height: actualCross,
          };
        } else {
          results[idx] = {
            x: container.x + pad.left + crossCursor + crossOffset,
            y: container.y + pad.top + mainCursor,
            width: actualCross,
            height: mSize,
          };
        }

        mainCursor +=
          mSize + gap + (li < line.indices.length - 1 ? lineExtraGap : 0);
      }

      crossCursor += lineCross + rGap;
    }

    return results;
  }

  // ===== NO-WRAP MODE (original) =====

  // Handle flex children
  let fixedMainSize = 0;
  let totalFlex = 0;
  for (const idx of relativeIndices) {
    const child = children[idx]!;
    const flex = child.flex ?? child.flexGrow;
    if (flex != null && flex > 0) {
      totalFlex += flex;
      childMainSizes[idx] = 0;
    } else {
      fixedMainSize += childMainSizes[idx]!;
    }
  }

  const totalGaps = Math.max(0, relativeIndices.length - 1) * gap;
  const remainingSpace = Math.max(0, mainAxis - fixedMainSize - totalGaps);
  for (const idx of relativeIndices) {
    const child = children[idx]!;
    const flex = child.flex ?? child.flexGrow;
    if (flex != null && flex > 0) {
      childMainSizes[idx] = (flex / totalFlex) * remainingSpace;
    }
  }

  // Total content
  let totalContentMain = totalGaps;
  for (const idx of relativeIndices) {
    totalContentMain += childMainSizes[idx]!;
  }

  // justifyContent
  let mainOffset = 0;
  let extraGap = 0;
  const jc = flexProps.justifyContent ?? 'start';
  const freeSpace = mainAxis - totalContentMain;

  switch (jc) {
    case 'center':
      mainOffset = freeSpace / 2;
      break;
    case 'end':
      mainOffset = freeSpace;
      break;
    case 'spaceBetween':
      if (relativeIndices.length > 1)
        extraGap = freeSpace / (relativeIndices.length - 1);
      break;
    case 'spaceAround':
      if (relativeIndices.length > 0) {
        const sp = freeSpace / relativeIndices.length;
        mainOffset = sp / 2;
        extraGap = sp;
      }
      break;
    case 'spaceEvenly':
      if (relativeIndices.length > 0) {
        const sp = freeSpace / (relativeIndices.length + 1);
        mainOffset = sp;
        extraGap = sp;
      }
      break;
    default:
      break;
  }

  // Position
  let cursor = mainOffset;

  for (let i = 0; i < relativeIndices.length; i++) {
    const idx = relativeIndices[i]!;
    const mSize = childMainSizes[idx]!;
    const cSize = childCrossSizes[idx]!;

    const align = children[idx]!.alignSelf ?? ai;
    const actualCross = align === 'stretch' ? crossAxis : cSize;
    let crossOffset = 0;
    switch (align) {
      case 'center':
        crossOffset = (crossAxis - actualCross) / 2;
        break;
      case 'end':
        crossOffset = crossAxis - actualCross;
        break;
      default:
        crossOffset = 0;
        break;
    }

    if (isRow) {
      results[idx] = {
        x: container.x + pad.left + cursor,
        y: container.y + pad.top + crossOffset,
        width: mSize,
        height: actualCross,
      };
    } else {
      results[idx] = {
        x: container.x + pad.left + crossOffset,
        y: container.y + pad.top + cursor,
        width: actualCross,
        height: mSize,
      };
    }

    cursor += mSize + gap + (i < relativeIndices.length - 1 ? extraGap : 0);
  }

  return results;
}

// ===== Hook =====

/**
 * Pure JS flex layout engine.
 * Calculates computed {x, y, width, height} for each child based on flex props.
 * Returns computed layouts and injects position into children via cloneElement.
 */
export function useYogaLayout(
  widgetId: string,
  container: ContainerRect,
  flexProps: YogaFlexProps,
  childrenElements: React.ReactNode
): { layouts: ComputedLayout[]; renderedChildren: React.ReactNode } {
  const childArray = React.Children.toArray(childrenElements);

  const layouts = useMemo(() => {
    const childInfos: ChildInfo[] = childArray.map((child) => {
      if (!React.isValidElement(child)) {
        return {
          width: undefined,
          height: undefined,
          flex: undefined,
          flexGrow: undefined,
          alignSelf: undefined,
          position: undefined,
          top: undefined,
          left: undefined,
          right: undefined,
          bottom: undefined,
        };
      }
      return extractChildInfo(child);
    });

    return calculateFlexLayout(container, flexProps, childInfos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    container.x,
    container.y,
    container.width,
    container.height,
    flexProps.flexDirection,
    flexProps.justifyContent,
    flexProps.alignItems,
    flexProps.gap,
    flexProps.padding,
    flexProps.flexWrap,
    childArray.length,
  ]);

  // Inject computed x, y, width, height into children via cloneElement
  const renderedChildren = childArray.map((child, i) => {
    if (!React.isValidElement(child)) return child;
    const layout = layouts[i];
    if (!layout) return child;

    return React.cloneElement(child as React.ReactElement<WidgetProps>, {
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
    });
  });

  // GAP-2 FIX: Write computed child layouts to layoutStore
  // so that markNeedsLayout / recalculateLayout can work
  useEffect(() => {
    // Lazy import to avoid circular deps
    const { useLayoutStore } = require('../stores/layoutStore');
    layouts.forEach((layout) => {
      // Store layout indexed by parent widgetId + child index
      useLayoutStore
        .getState()
        .setLayout(`${widgetId}_child_${layouts.indexOf(layout)}`, layout);
    });
  }, [layouts, widgetId]);

  return { layouts, renderedChildren };
}
