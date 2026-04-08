import * as React from 'react';
import { useMemo, useEffect } from 'react';
import type { WidgetProps } from '../types/widget.types';
import type { FlexChildStyle } from '../types/style.types';
import type { LayoutEntry } from '../stores/layoutStore';

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

// ===== BoxConstraints (Flutter-inspired) =====

interface BoxConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

// ===== Pure JS Flex Layout Engine =====
// Flutter-inspired constraint model:
// 1. Constraints Go Down: parent defines min/max for children
// 2. Sizes Go Up: children resolve size within constraints (greedy/humble)
// 3. Parent Sets Position: parent places children at (x, y)
// 4. Greedy (fill space) vs Humble (content-sized)

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

// ===== Child Info =====

interface ChildInfo {
  width: number | undefined;
  height: number | undefined;
  flex: number | undefined;
  flexGrow: number | undefined;
  alignSelf: string | undefined;
  position: string | undefined;
  top: number | undefined;
  left: number | undefined;
  right: number | undefined;
  bottom: number | undefined;
  // Type-aware sizing (Flutter "intrinsic size")
  componentType: string;
  fontSize: number | undefined;
  iconSize: number | undefined;
  // Content hints for greedy/humble detection
  hasChildren: boolean;
  hasIcon: boolean;
  childrenNodes: React.ReactNode;
  textContent: string | undefined; // for Text width estimation
  // Structural container properties for recursive evaluation
  flexDirection: string | undefined;
  flexWrap: string | undefined;
  gap: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

// ===== Intrinsic Size Estimation =====
// Simulates Flutter's "Sizes Go Up" — children report their natural size.

/** Humble widget: returns its intrinsic (content) size on main axis */
function getIntrinsicMainSize(child: ChildInfo, isRow: boolean, containerCrossAxis?: number): number | null {
  switch (child.componentType) {
    case 'SkiaText': // React.memo name for Text
    case 'Text': {
      const fs = child.fontSize ?? 14;
      if (isRow) {
        // Estimate text width: avg char width ≈ fontSize * 0.55 for mixed CJK/Latin
        const text = child.textContent ?? '';
        return Math.ceil(text.length * fs * 0.55) + 4; // +4 for padding
      }
      // Column: text height ≈ fontSize * 1.4 (single line)
      return Math.ceil(fs * 1.4);
    }
    case 'Icon':
      return child.iconSize ?? 24;
    case 'Spacer':
      return 0;
    case 'Button': {
      if (!isRow) return 40;
      let w = Math.max(80, (child.textContent?.length ?? 0) * 9 + 32);
      if (child.hasIcon && child.textContent) w += 32;
      return w;
    }
    case 'Input': return isRow ? 150 : 48;
    case 'Checkbox':
    case 'Radio': return 24;
    case 'Switch': return isRow ? 48 : 24;
    case 'Avatar': return child.iconSize ?? 48;
    case 'Chip': return isRow ? 64 : 32;
    case 'Progress': return isRow ? 100 : 16;
    case 'Slider': return isRow ? 150 : 40;
    case 'Badge': return 24;
    case 'Divider': return 1;
    case 'Row':
    case 'Column':
    case 'Box':
    case 'Section':
      if (child.childrenNodes) {
        const innerIsRow = child.componentType === 'Row' || child.flexDirection === 'row';
        if (isRow === innerIsRow) {
          const padMain = innerIsRow ? child.padding.left + child.padding.right : child.padding.top + child.padding.bottom;
          const passedCross = innerIsRow ? child.height ?? containerCrossAxis : child.width ?? containerCrossAxis;
          return estimateIntrinsicSize(child.childrenNodes, innerIsRow, child.gap, passedCross) + padMain;
        } else {
          const padCross = innerIsRow ? child.padding.top + child.padding.bottom : child.padding.left + child.padding.right;
          const passedCross = innerIsRow ? child.width ?? containerCrossAxis : child.height ?? containerCrossAxis;
          return estimateCrossSize(child.childrenNodes, innerIsRow, child.gap, passedCross, child.flexWrap) + padCross;
        }
      }
      return child.hasChildren ? 48 : 0;
    default:
      return child.hasChildren ? 48 : 40; // Default to a reasonable size instead of collapsing
  }
}

/** Humble widget: returns its intrinsic size on cross axis */
function getIntrinsicCrossSize(child: ChildInfo, isRow: boolean, containerCrossAxis?: number): number | null {
  switch (child.componentType) {
    case 'SkiaText':
    case 'Text':
      if (!isRow) return null; // Column cross = width, Text fills parent width
      return child.fontSize ? Math.ceil(child.fontSize * 1.4) : 20;
    case 'Icon':
      return child.iconSize ?? 24;
    case 'Button': return 40;
    case 'Input': return 48;
    case 'Checkbox':
    case 'Radio':
    case 'Switch': return 24;
    case 'Avatar': return child.iconSize ?? 48;
    case 'Chip': return 32;
    case 'Progress': return 16;
    case 'Slider': return 40;
    case 'Badge': return 24;
    case 'Divider': return 1;
    case 'Row':
    case 'Column':
    case 'Box':
    case 'Section':
      if (child.childrenNodes) {
        const innerIsRow = child.componentType === 'Row' || child.flexDirection === 'row';
        if (isRow === innerIsRow) {
          const padCross = innerIsRow ? child.padding.top + child.padding.bottom : child.padding.left + child.padding.right;
          const passedCross = innerIsRow ? child.width ?? containerCrossAxis : child.height ?? containerCrossAxis;
          return estimateCrossSize(child.childrenNodes, innerIsRow, child.gap, passedCross, child.flexWrap) + padCross;
        } else {
          const padMain = innerIsRow ? child.padding.left + child.padding.right : child.padding.top + child.padding.bottom;
          const passedCross = innerIsRow ? child.height ?? containerCrossAxis : child.width ?? containerCrossAxis;
          return estimateIntrinsicSize(child.childrenNodes, innerIsRow, child.gap, passedCross) + padMain;
        }
      }
      return child.hasChildren ? 48 : 0;
    default:
      return child.hasChildren ? 48 : 40;
  }
}



// ===== Component Type Extraction =====

function getComponentType(element: React.ReactElement): string {
  const type = element.type;
  if (typeof type === 'string') return type;
  const fn = type as {
    displayName?: string;
    name?: string;
    type?: { displayName?: string; name?: string };
  };
  return (
    fn.displayName ||
    fn.name ||
    fn.type?.displayName ||
    fn.type?.name ||
    'Unknown'
  );
}

function extractChildInfo(child: React.ReactElement): ChildInfo {
  const p = child.props as WidgetProps & {
    style?: FlexChildStyle & { width?: number; height?: number; fontSize?: number, flexDirection?: string, flexWrap?: string, padding?: number | [number, number, number, number], gap?: number };
    fontSize?: number;
    text?: string;
    size?: number;
    icon?: string;
    children?: React.ReactNode;
  };

  const s = p.style;
  return {
    width: s?.width,
    height: s?.height,
    flex: s?.flex,
    flexGrow: s?.flexGrow,
    alignSelf: s?.alignSelf,
    position: s?.position,
    top: s?.top,
    left: s?.left,
    right: s?.right,
    bottom: s?.bottom,
    componentType: getComponentType(child),
    fontSize: s?.fontSize ?? p.fontSize,
    iconSize: p.size,
    hasChildren: p.children != null,
    hasIcon: p.icon != null,
    childrenNodes: p.children,
    textContent: p.text ?? (typeof p.children === 'string' ? p.children : undefined),
    flexDirection: s?.flexDirection,
    flexWrap: s?.flexWrap,
    gap: s?.gap ?? 0,
    padding: parsePadding(s?.padding),
  };
}

// ===== Resolve Child Size Within Constraints =====
// Flutter Rule 2: "Sizes Go Up" — child decides size within parent constraints

function resolveChildSize(
  child: ChildInfo,
  constraints: BoxConstraints,
  isRow: boolean,
  alignItems: string
): { main: number; cross: number } {
  const hasFlex = (child.flex ?? child.flexGrow ?? 0) > 0;

  // === Main axis ===
  let main: number;
  const explicitMain = isRow ? child.width : child.height;

  if (explicitMain != null) {
    // Fixed size: clamp to constraints
    const maxMain = isRow ? constraints.maxWidth : constraints.maxHeight;
    const minMain = isRow ? constraints.minWidth : constraints.minHeight;
    main = Math.max(minMain, Math.min(explicitMain, maxMain));
  } else if (hasFlex) {
    // Flex child: main axis allocated later in flex distribution
    main = 0;
  } else {
    // Try intrinsic size (humble)
    const intrinsic = getIntrinsicMainSize(child, isRow);
    if (intrinsic != null) {
      const maxMain = isRow ? constraints.maxWidth : constraints.maxHeight;
      main = Math.min(intrinsic, maxMain);
    } else {
      // Fill reasonable space instead of collapsing to 0
      main = 48;
    }
  }

  // === Cross axis ===
  let cross: number;
  const explicitCross = isRow ? child.height : child.width;
  const maxCross = isRow ? constraints.maxHeight : constraints.maxWidth;

  if (explicitCross != null) {
    // Fixed cross size: clamp
    cross = Math.min(explicitCross, maxCross);
  } else {
    const selfAlign = child.alignSelf ?? alignItems;
    if (selfAlign === 'stretch') {
      // Stretch: fill parent cross-axis (like CSS stretch, Flutter default)
      cross = maxCross;
    } else {
      // Try intrinsic cross size (humble)
      const intrinsic = getIntrinsicCrossSize(child, isRow);
      cross = intrinsic != null ? Math.min(intrinsic, maxCross) : maxCross;
    }
  }

  return { main, cross };
}

// ===== Main Layout Function =====

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

  // Flutter Rule 1: Constraints Go Down
  // Column: children get maxWidth=innerW, maxHeight=unbounded (content determines)
  // Row: children get maxWidth=unbounded, maxHeight=innerH
  const childConstraints: BoxConstraints = {
    minWidth: 0,
    maxWidth: isRow ? Infinity : innerW,
    minHeight: 0,
    maxHeight: isRow ? innerH : Infinity,
  };

  const ai = flexProps.alignItems ?? 'stretch';

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

  // ===== Phase 1: Resolve child sizes =====
  // Flutter Rule 2: "Sizes Go Up" — each child resolves its size
  const childMainSizes: number[] = [];
  const childCrossSizes: number[] = [];

  // Use bounded constraints for cross-axis resolution
  const boundedConstraints: BoxConstraints = {
    ...childConstraints,
    maxWidth: isRow ? Infinity : innerW,
    maxHeight: isRow ? innerH : Infinity,
  };

  for (const idx of relativeIndices) {
    const child = children[idx]!;
    const resolved = resolveChildSize(child, boundedConstraints, isRow, ai);
    childMainSizes[idx] = resolved.main;
    childCrossSizes[idx] = resolved.cross;
  }

  // ===== Phase 2: Flex distribution =====

  if (shouldWrap) {
    return calculateWrapLayout(
      container,
      pad,
      isRow,
      gap,
      rGap,
      flexProps.justifyContent ?? 'start',
      ai,
      relativeIndices,
      children,
      childMainSizes,
      childCrossSizes,
      mainAxis,
      results
    );
  }

  // ===== NO-WRAP: distribute flex children =====
  let fixedMainSize = 0;
  let totalFlex = 0;

  for (const idx of relativeIndices) {
    const child = children[idx]!;
    const flex = child.flex ?? child.flexGrow;
    if (flex != null && flex > 0) {
      totalFlex += flex;
    } else {
      fixedMainSize += childMainSizes[idx]!;
    }
  }

  const totalGaps = Math.max(0, relativeIndices.length - 1) * gap;
  const remainingSpace = Math.max(0, mainAxis - fixedMainSize - totalGaps);

  // Allocate flex space
  for (const idx of relativeIndices) {
    const child = children[idx]!;
    const flex = child.flex ?? child.flexGrow;
    if (flex != null && flex > 0) {
      childMainSizes[idx] = (flex / totalFlex) * remainingSpace;
    }
  }

  // ===== Phase 3: Position children =====
  // Flutter Rule 3: "Parent Sets Position"

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

  let cursor = mainOffset;

  for (let i = 0; i < relativeIndices.length; i++) {
    const idx = relativeIndices[i]!;
    const mSize = childMainSizes[idx]!;
    const cSize = childCrossSizes[idx]!;

    // Cross-axis alignment
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

// ===== Wrap Layout =====

function calculateWrapLayout(
  container: ContainerRect,
  pad: { top: number; right: number; bottom: number; left: number },
  isRow: boolean,
  gap: number,
  rGap: number,
  jc: string,
  ai: string,
  relativeIndices: number[],
  children: ChildInfo[],
  childMainSizes: number[],
  childCrossSizes: number[],
  mainAxis: number,
  results: ComputedLayout[]
): ComputedLayout[] {
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
      lines.push(currentLine);
      currentLine = { indices: [idx], mainUsed: mSize, maxCross: cSize };
    } else {
      currentLine.indices.push(idx);
      currentLine.mainUsed += gapBefore + mSize;
      currentLine.maxCross = Math.max(currentLine.maxCross, cSize);
    }
  }
  if (currentLine.indices.length > 0) lines.push(currentLine);

  let crossCursor = 0;

  for (const line of lines) {
    const lineCross = line.maxCross;
    const freeMain = mainAxis - line.mainUsed;

    let mainCursor = 0;
    let lineExtraGap = 0;

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

// ===== Helpers & Caches =====

const intrinsicSizeCache = new WeakMap<object, { main?: number; cross?: number }>();

function getChildLayoutHash(info: ChildInfo): string {
  return `${info.width}_${info.height}_${info.flex}_${info.flexGrow}_${info.alignSelf}_${info.componentType}_${info.fontSize}_${info.iconSize}_${info.hasChildren}_${info.textContent}_${info.flexDirection}_${info.flexWrap}_${info.gap}_${info.padding.top}_${info.padding.right}_${info.padding.bottom}_${info.padding.left}`;
}

// ===== Hook =====

/**
 * Flutter-inspired constraint-based layout engine.
 *
 * 1. Constraints Go Down: parent container → child constraints
 * 2. Sizes Go Up: children resolve size (greedy/humble) within constraints
 * 3. Parent Sets Position: computed (x, y) injected via cloneElement
 *
 * Returns computed layouts and injects position into children.
 */
export function useYogaLayout(
  widgetId: string,
  container: ContainerRect,
  flexProps: YogaFlexProps,
  childrenElements: React.ReactNode
): { layouts: ComputedLayout[]; renderedChildren: React.ReactNode } {
  const childArray = React.Children.toArray(childrenElements);

  let childInfos: ChildInfo[] = [];
  let childrenHash = '';

  for (let i = 0; i < childArray.length; i++) {
    const child = childArray[i];
    if (!React.isValidElement(child)) {
      childInfos.push({
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
        componentType: 'Unknown',
        fontSize: undefined,
        iconSize: undefined,
        hasChildren: false,
        hasIcon: false,
        childrenNodes: undefined,
        textContent: undefined,
        flexDirection: undefined,
        flexWrap: undefined,
        gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      childrenHash += 'unknown|';
    } else {
      const info = extractChildInfo(child);
      childInfos.push(info);
      childrenHash += getChildLayoutHash(info) + '|';
    }
  }

  const layouts = useMemo(() => {
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
    childrenHash,
  ]);

  // Inject computed x, y into top-level props and width, height into style
  const renderedChildren = childArray.map((child, i) => {
    if (!React.isValidElement(child)) return child;
    const layout = layouts[i];
    if (!layout) return child;

    const existing = (child as React.ReactElement<{ style?: Record<string, unknown> }>).props;
    return React.cloneElement(child as React.ReactElement<WidgetProps & { style?: Record<string, unknown> }>, {
      x: layout.x,
      y: layout.y,
      style: {
        ...(existing.style ?? {}),
        width: layout.width,
        height: layout.height,
      },
    });
  });

  // Write computed child layouts to layoutStore
  useEffect(() => {
    const { useLayoutStore } = require('../stores/layoutStore');
    const batch = layouts.reduce((acc, layout, index) => {
      acc[`${widgetId}_child_${index}`] = { rect: layout };
      return acc;
    }, {} as Record<string, LayoutEntry>);

    useLayoutStore.getState().setLayouts(batch);
  }, [layouts, widgetId]);

  return { layouts, renderedChildren };
}

// ===== Helper for ScrollView auto-contentSize =====

/**
 * Estimate sequential content size (main axis) from children props.
 * Simulates wrapping and gap calculations recursively.
 */
export function estimateIntrinsicSize(
  children: React.ReactNode,
  isRow: boolean,
  gap: number = 0,
  containerCrossAxis?: number
): number {
  if (typeof children === 'object' && children !== null) {
    const cached = intrinsicSizeCache.get(children);
    if (cached?.main !== undefined) return cached.main;
  }

  const childArray = React.Children.toArray(children);
  let totalMain = 0;

  for (const child of childArray) {
    if (!React.isValidElement(child)) continue;
    const info = extractChildInfo(child);

    const explicitMain = isRow ? info.width : info.height;
    if (explicitMain != null) {
      totalMain += explicitMain;
    } else {
      const intrinsic = getIntrinsicMainSize(info, isRow, containerCrossAxis);
      totalMain += intrinsic ?? 48;
    }
  }

  // Add gaps between children
  if (childArray.length > 1) {
    totalMain += (childArray.length - 1) * gap;
  }

  if (typeof children === 'object' && children !== null) {
    const cached = intrinsicSizeCache.get(children) || {};
    cached.main = totalMain;
    intrinsicSizeCache.set(children, cached);
  }
  return totalMain;
}

/**
 * Estimate cross-axis size from children props.
 * Finds the maximum cross dimension of the children.
 */
export function estimateCrossSize(
  children: React.ReactNode,
  isRow: boolean,
  gap: number = 0,
  containerCrossAxis?: number,
  flexWrap?: string
): number {
  if (typeof children === 'object' && children !== null) {
    const cached = intrinsicSizeCache.get(children);
    if (cached?.cross !== undefined) return cached.cross;
  }

  const childArray = React.Children.toArray(children);

  if (isRow && flexWrap === 'wrap' && containerCrossAxis != null) {
    let lines = 1;
    let currentLineW = 0;
    let maxLineH = 0;
    let totalH = 0;

    for (const child of childArray) {
      if (!React.isValidElement(child)) continue;
      const info = extractChildInfo(child);
      const childW = info.width ?? getIntrinsicMainSize(info, true, undefined) ?? 48;
      const childH = info.height ?? getIntrinsicCrossSize(info, true, undefined) ?? 48;

      const gapBefore = currentLineW > 0 ? gap : 0;
      if (currentLineW + gapBefore + childW > containerCrossAxis) {
        totalH += maxLineH;
        lines++;
        currentLineW = childW;
        maxLineH = childH;
      } else {
        currentLineW += gapBefore + childW;
        maxLineH = Math.max(maxLineH, childH);
      }
    }
    totalH += maxLineH + (lines > 1 ? gap * (lines - 1) : 0);
    if (typeof children === 'object' && children !== null) {
      const cached = intrinsicSizeCache.get(children) || {};
      cached.cross = totalH;
      intrinsicSizeCache.set(children, cached);
    }
    return totalH;
  }

  let maxCross = 0;

  for (const child of childArray) {
    if (!React.isValidElement(child)) continue;
    const info = extractChildInfo(child);

    const explicitCross = isRow ? info.height : info.width;
    if (explicitCross != null) {
      maxCross = Math.max(maxCross, explicitCross);
    } else {
      const intrinsic = getIntrinsicCrossSize(info, isRow, containerCrossAxis);
      maxCross = Math.max(maxCross, intrinsic ?? 48);
    }
  }

  if (typeof children === 'object' && children !== null) {
    const cached = intrinsicSizeCache.get(children) || {};
    cached.cross = maxCross;
    intrinsicSizeCache.set(children, cached);
  }
  return maxCross;
}
