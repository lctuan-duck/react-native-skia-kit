import Reconciler from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants';
import type { UIEngine } from '../nitro/UIEngine.nitro';
import type { NativeYogaStyle } from '../nitro/UIEngine.nitro';
import type { ViewStyle } from 'react-native';
import { parseColor } from '../utils/color';
import { toNativeGradient } from '../utils/gradient';

// ── Per-node engine registry ──────────────────────────────────────────────────
// Maps nodeId → UIEngine instance, populated in createInstance.
// Lets lifecycle hooks (appendChild, removeChild) find the right engine
// without needing containerInfo (which isn’t always available).
const nodeToEngine = new Map<string, UIEngine>();

// ── Callback registry (JS thread) ────────────────────────────────────────────
// Stores gesture/event callbacks separately from the render tree.
// Avoids JSI roundtrips by using a JS Map lookup instead of querying C++.
type GestureCallbacks = {
  onPress?: (localX?: number, localY?: number) => void;
  onPressIn?: (localX?: number, localY?: number) => void;
  onPressOut?: (localX?: number, localY?: number) => void;
  onLongPress?: () => void;
  onPanStart?: (e: any) => void;
  onPanUpdate?: (e: any) => void;
  onPanEnd?: (e: any) => void;
};

const jsCallbacks = new Map<string, GestureCallbacks>();

export function getJSCallbacks(id: string): GestureCallbacks | undefined {
  return jsCallbacks.get(id);
}

function registerJSCallbacks(id: string, props: any) {
  const cbs: GestureCallbacks = {};
  if (props.onPress) cbs.onPress = props.onPress;
  if (props.onPressIn) cbs.onPressIn = props.onPressIn;
  if (props.onPressOut) cbs.onPressOut = props.onPressOut;
  if (props.onLongPress) cbs.onLongPress = props.onLongPress;
  if (props.onPanStart) cbs.onPanStart = props.onPanStart;
  if (props.onPanUpdate) cbs.onPanUpdate = props.onPanUpdate;
  if (props.onPanEnd) cbs.onPanEnd = props.onPanEnd;

  if (Object.keys(cbs).length > 0) {
    jsCallbacks.set(id, cbs);
  } else {
    // Remove entry if no callbacks remain → prevents memory leak
    jsCallbacks.delete(id);
  }
}

function unregisterJSCallbacks(id: string) {
  jsCallbacks.delete(id);
}

// Track parent→children relationships in JS so we can recursively
// unregister HitTest + callbacks for ALL descendants when a tree is removed.
// This fixes the "ghost hit target" bug after screen navigation.
const nodeChildren = new Map<string, Set<string>>();

function trackChild(parentId: string, childId: string) {
  if (!nodeChildren.has(parentId)) {
    nodeChildren.set(parentId, new Set());
  }
  nodeChildren.get(parentId)!.add(childId);
}

function untrackChild(parentId: string, childId: string) {
  nodeChildren.get(parentId)?.delete(childId);
}

/**
 * Recursively unregister a node and all its JS-tracked descendants from:
 * - HitTestSubsystem (widget + scroll area)
 * - JS callback registry
 * - Layout + Render subsystems
 *
 * This prevents "ghost" hit targets from previous screens showing up
 * after navigation between screens.
 */
function recursiveUnregister(id: string) {
  const engine = nodeToEngine.get(id);

  // 1. Recurse into children first (depth-first)
  const children = nodeChildren.get(id);
  if (children) {
    for (const childId of children) {
      recursiveUnregister(childId);
    }
    nodeChildren.delete(id);
  }

  // 2. Cleanup this node
  if (engine) {
    engine.removeRenderNode(id);
    engine.unregisterWidget(id);
  }
  nodeToEngine.delete(id);
  unregisterJSCallbacks(id);
}

function isInteractive(props: any): boolean {
  return !!(
    props.onPress ||
    props.onPressIn ||
    props.onPressOut ||
    props.onLongPress ||
    props.onPanStart ||
    props.onPanUpdate ||
    props.onPanEnd
  );
}

// ── Style converters ──────────────────────────────────────────────────────────

import type { NativeBoxProps } from '../nitro/UIEngine.nitro';

/**
 * extractBoxProps — Converts JS BoxStyle → NativeBoxProps for the C++ bridge.
 *
 * Phase 3: gradient colors (hex strings) are converted to SkColor (uint32)
 * via `toNativeGradient()` before being passed to C++.
 */
function extractBoxProps(props: any): NativeBoxProps {
  const style = props.style || {};

  // Phase 3: convert GradientProps (hex strings) → NativeGradientProps (SkColor uint32)
  const gradient = style.gradient
    ? toNativeGradient(style.gradient)
    : undefined;

  return {
    backgroundColor: parseColor(style.backgroundColor),

    borderRadius: style.borderRadius ?? 0,
    borderTopLeftRadius: style.borderTopLeftRadius,
    borderTopRightRadius: style.borderTopRightRadius,
    borderBottomRightRadius: style.borderBottomRightRadius,
    borderBottomLeftRadius: style.borderBottomLeftRadius,

    borderWidth: style.borderWidth ?? 0,
    borderTopWidth: style.borderTopWidth,
    borderRightWidth: style.borderRightWidth,
    borderBottomWidth: style.borderBottomWidth,
    borderLeftWidth: style.borderLeftWidth,

    borderColor: parseColor(style.borderColor),
    borderTopColor: parseColor(style.borderTopColor),
    borderRightColor: parseColor(style.borderRightColor),
    borderBottomColor: parseColor(style.borderBottomColor),
    borderLeftColor: parseColor(style.borderLeftColor),

    borderStyle: style.borderStyle,
    dashLength: style.dashLength,
    dashSpacing: style.dashSpacing,

    elevation: props.elevation ?? style.elevation ?? 0,

    shadowColor: parseColor(style.shadowColor),
    shadowOffsetX: style.shadowOffsetX,
    shadowOffsetY: style.shadowOffsetY,
    shadowBlur: style.shadowBlur,
    shadowOpacity: style.shadowOpacity,
    shadowSpread: style.shadowSpread,
    shadowType: style.shadowType,

    overflowHidden: style.overflow === 'hidden',

    // Phase 3: Shaders & Filters
    gradient,
    backdropBlurRadius: style.backdropBlurRadius,
    blendMode: style.blendMode,
    colorFilter: style.colorFilter,
  };
}

/**
 * buildNativeStyle — Converts React Native ViewStyle to NativeYogaStyle.
 *
 * IMPORTANT: Only maps layout props (flex, padding, margin, dimensions...).
 * Visual props (backgroundColor, borderRadius...) are passed separately via NativeBoxProps.
 *
 * Supports padding/margin shorthands: style.padding and style.paddingVertical/Horizontal
 * are expanded to per-edge values so C++ receives the correct values.
 */
export function buildNativeStyle(
  style?: ViewStyle & {
    padding?: any;
    paddingHorizontal?: any;
    paddingVertical?: any;
    margin?: any;
    marginHorizontal?: any;
    marginVertical?: any;
    gap?: any;
    rowGap?: any;
    columnGap?: any;
  }
): NativeYogaStyle {
  if (!style) return {};

  // Expand padding shorthand: per-edge > axis > all
  let pt = style.paddingTop ?? style.paddingVertical;
  let pb = style.paddingBottom ?? style.paddingVertical;
  let pl = style.paddingLeft ?? style.paddingHorizontal;
  let pr = style.paddingRight ?? style.paddingHorizontal;

  if (style.padding !== undefined) {
    if (Array.isArray(style.padding)) {
      if (style.padding.length === 4) {
        pt = pt ?? style.padding[0];
        pr = pr ?? style.padding[1];
        pb = pb ?? style.padding[2];
        pl = pl ?? style.padding[3];
      }
    } else {
      pt = pt ?? style.padding;
      pb = pb ?? style.padding;
      pl = pl ?? style.padding;
      pr = pr ?? style.padding;
    }
  }

  // Expand margin shorthand
  let mt = style.marginTop ?? style.marginVertical;
  let mb = style.marginBottom ?? style.marginVertical;
  let ml = style.marginLeft ?? style.marginHorizontal;
  let mr = style.marginRight ?? style.marginHorizontal;

  if (style.margin !== undefined) {
    if (Array.isArray(style.margin)) {
      if (style.margin.length === 4) {
        mt = mt ?? style.margin[0];
        mr = mr ?? style.margin[1];
        mb = mb ?? style.margin[2];
        ml = ml ?? style.margin[3];
      }
    } else {
      mt = mt ?? style.margin;
      mb = mb ?? style.margin;
      ml = ml ?? style.margin;
      mr = mr ?? style.margin;
    }
  }

  const result: NativeYogaStyle = {};

  // Container flex
  if (style.flexDirection != null)
    result.flexDirection = style.flexDirection as string;
  if (style.justifyContent != null)
    result.justifyContent = style.justifyContent as string;
  if (style.alignItems != null) result.alignItems = style.alignItems as string;
  if (style.alignContent != null)
    result.alignContent = style.alignContent as string;
  if (style.flexWrap != null) result.flexWrap = style.flexWrap as string;
  if (style.gap != null) result.gap = style.gap as number;
  if (style.rowGap != null) result.rowGap = style.rowGap as number;
  if (style.columnGap != null) result.columnGap = style.columnGap as number;

  // Child flex
  if (style.flex != null) result.flex = style.flex as number;
  if (style.flexGrow != null) result.flexGrow = style.flexGrow as number;
  if (style.flexShrink != null) result.flexShrink = style.flexShrink as number;
  if (style.flexBasis != null)
    result.flexBasis = style.flexBasis as number | string;
  if (style.alignSelf != null) result.alignSelf = style.alignSelf as string;

  // Dimensions
  if (style.width != null) result.width = style.width as number | string;
  if (style.height != null) result.height = style.height as number | string;
  if (style.minWidth != null)
    result.minWidth = style.minWidth as number | string;
  if (style.maxWidth != null)
    result.maxWidth = style.maxWidth as number | string;
  if (style.minHeight != null)
    result.minHeight = style.minHeight as number | string;
  if (style.maxHeight != null)
    result.maxHeight = style.maxHeight as number | string;
  if (style.aspectRatio != null)
    result.aspectRatio = style.aspectRatio as number;

  // Layout rules
  if (style.display != null) result.display = style.display as string;
  if (style.overflow != null) result.overflow = style.overflow as string;

  // Padding (per-edge, already expanded above)
  if (pt != null) result.paddingTop = pt as number | string;
  if (pb != null) result.paddingBottom = pb as number | string;
  if (pl != null) result.paddingLeft = pl as number | string;
  if (pr != null) result.paddingRight = pr as number | string;

  // Margin (per-edge, already expanded above)
  if (mt != null) result.marginTop = mt as number | string;
  if (mb != null) result.marginBottom = mb as number | string;
  if (ml != null) result.marginLeft = ml as number | string;
  if (mr != null) result.marginRight = mr as number | string;

  // Absolute positioning
  if (style.position != null) result.position = style.position as string;
  if (style.top != null) result.top = style.top as number | string;
  if (style.left != null) result.left = style.left as number | string;
  if (style.right != null) result.right = style.right as number | string;
  if (style.bottom != null) result.bottom = style.bottom as number | string;

  return result;
}

/**
 * shallowEqualYogaStyle — Compares two styles to determine if layout has changed.
 * Used in prepareUpdate to avoid unnecessary commitUpdate calls.
 */
function shallowEqualYogaStyle(a?: ViewStyle, b?: ViewStyle): boolean {
  const keys: (keyof ViewStyle)[] = [
    'flex',
    'flexGrow',
    'flexShrink',
    'flexBasis',
    'flexDirection',
    'justifyContent',
    'alignItems',
    'alignSelf',
    'alignContent',
    'flexWrap',
    'width',
    'height',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'paddingHorizontal',
    'paddingVertical',
    'padding',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'marginHorizontal',
    'marginVertical',
    'margin',
    'position',
    'top',
    'left',
    'right',
    'bottom',
    'gap',
    'rowGap',
    'columnGap',
    'aspectRatio',
    'display',
    'overflow',
  ];
  for (const k of keys) {
    if ((a as any)?.[k] !== (b as any)?.[k]) return false;
  }
  return true;
}

// ── Host Config (base) ────────────────────────────────────────────────────────

/**
 * baseHostConfig — All hostConfig methods that don't need a per-canvas closure.
 * createSkiaKitHostConfig() spreads this object and overrides resetAfterCommit.
 *
 * Type params: Container = { canvasId: string }, Instance = string (nodeId)
 */
const baseHostConfig = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: false, // Coexist với React Native renderer

  // ── Scheduling ────────────────────────────────────────────────────────────
  getCurrentUpdatePriority() {
    return DefaultEventPriority;
  },
  resolveUpdatePriority() {
    return DefaultEventPriority;
  },
  setCurrentUpdatePriority() {},
  resolveEventTimeStamp() {
    return Date.now();
  },
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  warnsIfNotActing: true,
  resolveEventType() {
    return null;
  },
  resolveEventPriority() {
    return DefaultEventPriority;
  },
  requestPostPaintCallback() {},
  trackSchedulerEvent() {},
  trackSchedulerEventInDEV() {},
  detachDeletedInstance() {},
  shouldAttemptEagerTransition() {
    return false;
  },

  // ── React 19: Commit suspension (must all return false/null for custom renderers) ──
  // These are NEW in React 19. If missing, React calls undefined() → TypeError → commit aborts.
  maySuspendCommit(_type: string, _props: any) {
    return false;
  },
  maySuspendCommitOnUpdate(_type: string, _oldProps: any, _newProps: any) {
    return false;
  },
  maySuspendCommitInSyncRender(_type: string, _props: any) {
    return false;
  },
  preloadInstance(_type: string, _props: any) {
    return true;
  }, // true = already loaded
  startSuspendingCommit() {},
  suspendInstance(_type: string, _props: any) {},
  waitForCommitToBeReady() {
    return null;
  }, // null = not suspending

  // ── React 19: Microtask scheduling ────────────────────────────────────────
  supportsMicrotasks: true,
  scheduleMicrotask: queueMicrotask,

  // ── React 19: getSuspendedCommitReason (for debugging) ────────────────────
  getSuspendedCommitReason() {
    return null;
  },

  // ── Node creation ─────────────────────────────────────────────────────────

  /**
   * createInstance — Creates a C++ node when the Reconciler mounts a component.
   * Returns nodeId (string) — used by the Reconciler as `instance` throughout the lifecycle.
   *
   * Each type maps to a different C++ node type.
   * Fallback (Column/Row/Scaffold/...): transparent BoxNode to keep the tree intact.
   */
  createInstance(
    type: string,
    props: any,
    rootContainer: { canvasId: string; engine: UIEngine },
    _hostContext: { canvasId: string; engine: UIEngine }
  ): string {
    const engine = rootContainer.engine;
    const id: string =
      props.id || `w_${Math.random().toString(36).substr(2, 9)}`;
    const yogaStyle = buildNativeStyle(props.style);
    // Register node → engine mapping for lifecycle hooks
    nodeToEngine.set(id, engine);

    switch (type) {
      case 'Box': {
        const boxProps = extractBoxProps(props);
        engine.createBoxNode(id, yogaStyle, boxProps);
        // Register HitTest ONLY if interactive
        if (isInteractive(props) || props.hitTestBehavior) {
          const zIndex = props.style?.zIndex ?? 0;
          const behavior = props.hitTestBehavior === 'opaque' ? 1 : 0;
          engine.registerWidget(id, 0, 0, 0, 0, zIndex, behavior);
        }
        break;
      }

      case 'Text': {
        const fontWeight =
          typeof props.style?.fontWeight === 'string'
            ? parseInt(props.style.fontWeight, 10) || 400
            : props.style?.fontWeight ?? 400;
        engine.createTextNode(id, yogaStyle, {
          content: String(props.text ?? props.children ?? ''),
          fontSize: props.style?.fontSize ?? 14,
          color: parseColor(props.style?.color),
          fontFamily: props.style?.fontFamily ?? '',
          fontWeight,
          numberOfLines: props.numberOfLines ?? props.style?.numberOfLines ?? 0,
        });
        // Text có thể interactive (onPress)
        if (isInteractive(props) || props.hitTestBehavior) {
          const zIndex = props.style?.zIndex ?? 0;
          const behavior = props.hitTestBehavior === 'opaque' ? 1 : 0;
          engine.registerWidget(id, 0, 0, 0, 0, zIndex, behavior);
        }
        break;
      }

      case 'Image': {
        const src = props.src ?? props.source?.uri ?? props.uri ?? '';
        const fit = props.resizeMode ?? props.style?.objectFit ?? 'cover';
        const borderRadius = props.style?.borderRadius ?? 0;
        engine.createImageNode(id, src, fit, borderRadius);
        // C++ auto-triggers image load when uri is non-empty (no JS call needed)
        if (isInteractive(props)) {
          const zIndex = props.style?.zIndex ?? 0;
          engine.registerWidget(id, 0, 0, 0, 0, zIndex, 0);
        }
        break;
      }

      case 'Icon': {
        const isStroke = props.pathStyle === 'stroke';
        engine.createIconNode(
          id,
          yogaStyle,
          props.pathStr || '',
          parseColor(props.color),
          isStroke,
          props.strokeWidth ?? 2
        );
        if (isInteractive(props)) {
          const zIndex = props.style?.zIndex ?? 0;
          engine.registerWidget(id, 0, 0, 0, 0, zIndex, 0);
        }
        break;
      }

      case 'Scroll': {
        const contentPadding =
          props.contentPadding ?? props.style?.padding ?? 0;
        const zIndex = props.style?.zIndex ?? 0;
        // createScrollNodeFull atomically:
        //   createScrollNode + updateLayoutNode(overflow:hidden) +
        //   registerScrollArea + registerWidget
        // Replaces 4 JSI calls with 1.
        engine.createScrollNodeFull(
          id,
          { ...yogaStyle, overflow: 'hidden' },
          props.horizontal ?? false,
          contentPadding,
          zIndex
        );
        break;
      }

      // ── Layout container aliases → BoxNode with full visual props ────────
      case 'Column':
      case 'Row':
      case 'Stack':
      case 'Scaffold':
      case 'SafeArea':
      case 'Screen':
      case 'Nav':
      case 'Center':
      case 'Align':
      case 'Expanded':
      case 'Flexible':
      case 'Wrap':
      case 'Spacer': {
        const boxProps = extractBoxProps(props);
        engine.createBoxNode(id, yogaStyle, boxProps);
        if (isInteractive(props) || props.hitTestBehavior) {
          const zIndex = props.style?.zIndex ?? 0;
          const behavior = props.hitTestBehavior === 'opaque' ? 1 : 0;
          engine.registerWidget(id, 0, 0, 0, 0, zIndex, behavior);
        }
        break;
      }

      default: {
        // Fallback: unknown types (skGroup, etc.) → transparent BoxNode
        engine.createBoxNode(id, yogaStyle, {
          backgroundColor: parseColor(props.style?.backgroundColor) ?? 0,
          borderRadius: props.style?.borderRadius ?? 0,
          borderWidth: props.style?.borderWidth ?? 0,
          borderColor: parseColor(props.style?.borderColor) ?? 0,
          elevation: props.elevation ?? 0,
          overflowHidden: props.style?.overflow === 'hidden',
        });
        break;
      }
    }

    registerJSCallbacks(id, props);
    if (__DEV__) {
      // console.log(`[SkiaKit Reconciler] createInstance type=${type} id=${id}`);
    }
    return id;
  },

  /**
   * createTextInstance — Handles plain text strings in JSX.
   * Example: <Box>Hello {name}</Box> automatically wrapped as a TextNode.
   */
  createTextInstance(text: string, rootContainer: any): string {
    const id = `t_${Math.random().toString(36).substr(2, 9)}`;
    const engine: UIEngine | undefined = rootContainer?.engine;
    if (engine) {
      engine.createTextNode(
        id,
        {},
        {
          content: text,
          fontSize: 14,
          color: 0xff000000,
          fontFamily: '',
          fontWeight: 400,
          numberOfLines: 0,
        }
      );
      nodeToEngine.set(id, engine);
    }
    return id;
  },

  // ── Tree manipulation ─────────────────────────────────────────────────────

  appendInitialChild(parentId: string, childId: string) {
    nodeToEngine.get(parentId)?.addRenderChild(parentId, childId);
    trackChild(parentId, childId);
  },
  appendChild(parentId: string, childId: string) {
    nodeToEngine.get(parentId)?.addRenderChild(parentId, childId);
    trackChild(parentId, childId);
  },
  appendChildToContainer(
    containerInfo: { canvasId: string; engine: UIEngine },
    childId: string
  ) {
    containerInfo.engine.addRenderChild(containerInfo.canvasId, childId);
    trackChild(containerInfo.canvasId, childId);
  },

  removeChild(parentId: string, childId: string) {
    nodeToEngine.get(parentId)?.removeRenderChild(parentId, childId);
    untrackChild(parentId, childId);
    recursiveUnregister(childId);
  },
  removeChildFromContainer(
    containerInfo: { canvasId: string; engine: UIEngine },
    childId: string
  ) {
    containerInfo.engine.removeRenderChild(containerInfo.canvasId, childId);
    recursiveUnregister(childId);
  },

  insertBefore(parentId: string, childId: string, beforeChildId: string) {
    nodeToEngine.get(parentId)?.insertRenderChildBefore(parentId, childId, beforeChildId);
  },
  insertInContainerBefore(
    containerInfo: { canvasId: string; engine: UIEngine },
    childId: string,
    beforeChildId: string
  ) {
    containerInfo.engine.insertRenderChildBefore(
      containerInfo.canvasId,
      childId,
      beforeChildId
    );
  },

  // ── Update ────────────────────────────────────────────────────────────────

  /**
   * prepareUpdate — Diffs props and returns an update payload.
   * Returns null if nothing changed, so commitUpdate is skipped entirely.
   *
   * Optimization: avoids unnecessary JSI calls when state changes
   * but visual/layout props are unchanged.
   */
  prepareUpdate(_id: string, type: string, oldProps: any, newProps: any) {
    if (type === 'Box') {
      const visualChanged =
        oldProps.style?.backgroundColor !== newProps.style?.backgroundColor ||
        oldProps.style?.borderRadius !== newProps.style?.borderRadius ||
        oldProps.style?.borderWidth !== newProps.style?.borderWidth ||
        oldProps.style?.borderColor !== newProps.style?.borderColor ||
        oldProps.style?.overflow !== newProps.style?.overflow ||
        oldProps.elevation !== newProps.elevation ||
        // Phase 3: detect shader/filter changes
        oldProps.style?.gradient !== newProps.style?.gradient ||
        oldProps.style?.backdropBlurRadius !==
          newProps.style?.backdropBlurRadius ||
        oldProps.style?.blendMode !== newProps.style?.blendMode ||
        oldProps.style?.colorFilter !== newProps.style?.colorFilter;
      const layoutChanged = !shallowEqualYogaStyle(
        oldProps.style,
        newProps.style
      );
      const interactionChanged =
        oldProps.hitTestBehavior !== newProps.hitTestBehavior ||
        isInteractive(oldProps) !== isInteractive(newProps);
      if (!visualChanged && !layoutChanged && !interactionChanged) return null;
      return { type };
    }
    if (type === 'Text') {
      const contentChanged =
        (oldProps.text ?? oldProps.children) !==
          (newProps.text ?? newProps.children) ||
        oldProps.numberOfLines !== newProps.numberOfLines;
      const styleChanged =
        oldProps.style?.fontSize !== newProps.style?.fontSize ||
        oldProps.style?.color !== newProps.style?.color ||
        oldProps.style?.fontFamily !== newProps.style?.fontFamily ||
        oldProps.style?.fontWeight !== newProps.style?.fontWeight;
      const layoutChanged = !shallowEqualYogaStyle(
        oldProps.style,
        newProps.style
      );
      const interactionChanged =
        oldProps.hitTestBehavior !== newProps.hitTestBehavior ||
        isInteractive(oldProps) !== isInteractive(newProps);
      if (
        !contentChanged &&
        !styleChanged &&
        !layoutChanged &&
        !interactionChanged
      )
        return null;
      return { type };
    }
    if (type === 'Icon') {
      const changed =
        oldProps.pathStr !== newProps.pathStr ||
        oldProps.color !== newProps.color ||
        oldProps.pathStyle !== newProps.pathStyle ||
        oldProps.strokeWidth !== newProps.strokeWidth ||
        !shallowEqualYogaStyle(oldProps.style, newProps.style);
      const interactionChanged =
        oldProps.hitTestBehavior !== newProps.hitTestBehavior ||
        isInteractive(oldProps) !== isInteractive(newProps);
      if (!changed && !interactionChanged) return null;
      return { type };
    }
    if (type === 'Image') {
      const srcOld = oldProps.src ?? oldProps.source?.uri ?? oldProps.uri ?? '';
      const srcNew = newProps.src ?? newProps.source?.uri ?? newProps.uri ?? '';
      const interactionChanged =
        oldProps.hitTestBehavior !== newProps.hitTestBehavior ||
        isInteractive(oldProps) !== isInteractive(newProps);
      if (srcOld === srcNew && !interactionChanged) return null;
      return { type };
    }
    if (type === 'Scroll') {
      // Always update Scroll — callbacks (onPanStart/Update/End) change when viewportSize/contentSize change
      // If we return null here, registerJSCallbacks never runs, leaving stale closures that
      // have wrong viewportSize/contentSize captured, causing maxScroll to be wrong.
      return { type };
    }
    // Fallback types: check layout only
    if (!shallowEqualYogaStyle(oldProps.style, newProps.style)) return { type };
    return null;
  },

  /**
   * commitUpdate — Updates the C++ node when props change.
   * Only runs when prepareUpdate returns a non-null payload.
   */
  commitUpdate(...args: any[]) {
    let id: string, type: string, newProps: any;
    if (typeof args[1] === 'string') {
      id = args[0]; type = args[1]; newProps = args[3];
    } else {
      id = args[0]; type = args[2]; newProps = args[4];
    }

    const engine = nodeToEngine.get(id);
    if (!engine) return; // node already removed
    const yogaStyle = buildNativeStyle(newProps?.style);

    switch (type) {
      case 'Box': {
        const boxProps = extractBoxProps(newProps);
        engine.updateBoxNode(id, yogaStyle, boxProps);
        break;
      }

      case 'Text': {
        const fontWeight =
          typeof newProps.style?.fontWeight === 'string'
            ? parseInt(newProps.style.fontWeight, 10) || 400
            : newProps.style?.fontWeight ?? 400;
        engine.updateTextNode(id, yogaStyle, {
          content: String(newProps.text ?? newProps.children ?? ''),
          fontSize: newProps.style?.fontSize ?? 14,
          color: parseColor(newProps.style?.color),
          fontFamily: newProps.style?.fontFamily ?? '',
          fontWeight,
          numberOfLines: newProps.numberOfLines ?? 0,
        });
        break;
      }

      case 'Icon': {
        const isStroke = newProps.pathStyle === 'stroke';
        engine.updateIconNode(
          id,
          yogaStyle,
          newProps.pathStr || '',
          parseColor(newProps.color),
          isStroke,
          newProps.strokeWidth ?? 2
        );
        break;
      }

      case 'Image': {
        const src = newProps.src ?? newProps.source?.uri ?? newProps.uri ?? '';
        const fit = newProps.resizeMode ?? newProps.style?.objectFit ?? 'cover';
        const borderRadius = newProps.style?.borderRadius ?? 0;
        engine.updateImageNode(id, src, fit, borderRadius);
        // C++ auto-triggers image load when uri changes
        break;
      }

      case 'Scroll': {
        const scrollUpdateStyle = { ...yogaStyle, overflow: 'hidden' };
        engine.updateLayoutNode(id, scrollUpdateStyle);
        const contentPadding =
          newProps.contentPadding ?? newProps.style?.padding ?? 0;
        engine.updateScrollNode(
          id,
          newProps.horizontal ?? false,
          contentPadding
        );
        const zIndex = newProps.style?.zIndex ?? 0;
        engine.registerWidget(id, 0, 0, 0, 0, zIndex, 0);
        break;
      }

      default: {
        const boxProps = extractBoxProps(newProps);
        engine.updateBoxNode(id, yogaStyle, boxProps);
        break;
      }
    }

    registerJSCallbacks(id, newProps);
  },

  // ── Context ───────────────────────────────────────────────────────────────

  /**
   * getRootHostContext — forward engine + canvasId xuống toàn bộ cây qua hostContext.
   */
  getRootHostContext(rootContainer: { canvasId: string; engine: UIEngine }) {
    return rootContainer;
  },
  getChildHostContext(parentContext: any) {
    return parentContext;
  },

  // ── Commit lifecycle ───────────────────────────────────────────────────────

  /**
   * prepareForCommit — MUST return containerInfo so resetAfterCommit receives it.
   * React bắt buộc return non-null để resetAfterCommit hoạt động đúng.
   */
  prepareForCommit(containerInfo: { canvasId: string; engine: UIEngine }) {
    return containerInfo;
  },

  /**
   * resetAfterCommit — no-op mặc định, override trong createSkiaKitHostConfig.
   */
  resetAfterCommit(_containerInfo: { canvasId: string; engine: UIEngine }) {},

  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,
  clearContainer: () => {},
  getCurrentEventPriority: () => DefaultEventPriority,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  preparePortalMount() {},
} as const;


// ── Factory per CanvasRoot ──────────────────────────────────────────────────

/**
 * createSkiaKitHostConfig(engine, requestRedraw) — tạo hostConfig per CanvasRoot.
 * Engine được pass qua containerInfo để tất cả reconciler lifecycle dùng đúng instance.
 */
export function createSkiaKitHostConfig(
  engine: UIEngine,
  requestRedraw: () => void
) {
  return {
    ...baseHostConfig,
    resetAfterCommit(containerInfo: { canvasId: string; engine: UIEngine }) {
      if (containerInfo?.canvasId) {
        engine.markDirty(containerInfo.canvasId);
        requestRedraw();
      }
    },
  };
}

export const SkiaKitReconciler = Reconciler(baseHostConfig as any);

