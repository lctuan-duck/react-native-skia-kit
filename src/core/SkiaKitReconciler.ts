import Reconciler from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants';
import { uiEngine } from './GlobalEngine';
import type { NativeYogaStyle } from '../nitro/UIEngine.nitro';
import type { ViewStyle } from 'react-native';

// ── Callback registry (JS thread) ────────────────────────────────────────────
// Lưu trữ gesture/event callbacks riêng biệt với render tree.
// Tránh JSI roundtrips bằng cách lookup JS Map thay vì query C++.
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
    // Xóa entry nếu không còn callback nào → tránh memory leak
    jsCallbacks.delete(id);
  }
}

function unregisterJSCallbacks(id: string) {
  jsCallbacks.delete(id);
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

/**
 * parseColor — Chuyển CSS color string → SkColor (ARGB packed uint32).
 * Hỗ trợ: #RGB, #RRGGBB, #RRGGBBAA, rgba(), transparent.
 * Luôn trả về number (không trả về undefined) — SkColor 0x00000000 = transparent.
 */
export function parseColor(color?: string): number {
  if (!color || color === 'transparent') return 0x00000000;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0]! + hex[0]!, 16);
      const g = parseInt(hex[1]! + hex[1]!, 16);
      const b = parseInt(hex[2]! + hex[2]!, 16);
      return (0xFF000000 | (r << 16) | (g << 8) | b) >>> 0;
    }
    if (hex.length === 6) {
      const n = parseInt(hex, 16);
      return (0xFF000000 | n) >>> 0;
    }
    if (hex.length === 8) {
      // #RRGGBBAA → AARRGGBB (SkColor is ARGB)
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16);
      return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
    }
  }
  if (color.startsWith('rgb')) {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) {
      const r = parseInt(m[1]!), g = parseInt(m[2]!), b = parseInt(m[3]!);
      const a = Math.round((parseFloat(m[4] ?? '1')) * 255);
      return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
    }
  }
  // Fallback — không parse được → transparent
  return 0x00000000;
}

/**
 * buildNativeStyle — Chuyển React Native ViewStyle → NativeYogaStyle.
 *
 * QUAN TRỌNG: Chỉ map layout props (flex, padding, margin, dimensions...).
 * Visual props (backgroundColor, borderRadius...) được pass riêng qua NativeBoxProps.
 *
 * Hỗ trợ shorthand padding/margin: style.padding và style.paddingVertical/Horizontal
 * được expand thành per-edge values để C++ nhận đúng.
 */
export function buildNativeStyle(style?: ViewStyle & {
  padding?: any;
  paddingHorizontal?: any;
  paddingVertical?: any;
  margin?: any;
  marginHorizontal?: any;
  marginVertical?: any;
  gap?: any;
  rowGap?: any;
  columnGap?: any;
}): NativeYogaStyle {
  if (!style) return {};

  // Expand padding shorthand: per-edge > axis > all
  const pt = style.paddingTop ?? style.paddingVertical ?? style.padding;
  const pb = style.paddingBottom ?? style.paddingVertical ?? style.padding;
  const pl = style.paddingLeft ?? style.paddingHorizontal ?? style.padding;
  const pr = style.paddingRight ?? style.paddingHorizontal ?? style.padding;

  // Expand margin shorthand
  const mt = style.marginTop ?? style.marginVertical ?? style.margin;
  const mb = style.marginBottom ?? style.marginVertical ?? style.margin;
  const ml = style.marginLeft ?? style.marginHorizontal ?? style.margin;
  const mr = style.marginRight ?? style.marginHorizontal ?? style.margin;

  const result: NativeYogaStyle = {};

  // Container flex
  if (style.flexDirection != null) result.flexDirection = style.flexDirection as string;
  if (style.justifyContent != null) result.justifyContent = style.justifyContent as string;
  if (style.alignItems != null) result.alignItems = style.alignItems as string;
  if (style.alignContent != null) result.alignContent = style.alignContent as string;
  if (style.flexWrap != null) result.flexWrap = style.flexWrap as string;
  if (style.gap != null) result.gap = style.gap as number;
  if (style.rowGap != null) result.rowGap = style.rowGap as number;
  if (style.columnGap != null) result.columnGap = style.columnGap as number;

  // Child flex
  if (style.flex != null) result.flex = style.flex as number;
  if (style.flexGrow != null) result.flexGrow = style.flexGrow as number;
  if (style.flexShrink != null) result.flexShrink = style.flexShrink as number;
  if (style.flexBasis != null) result.flexBasis = style.flexBasis as number | string;
  if (style.alignSelf != null) result.alignSelf = style.alignSelf as string;

  // Dimensions
  if (style.width != null) result.width = style.width as number | string;
  if (style.height != null) result.height = style.height as number | string;
  if (style.minWidth != null) result.minWidth = style.minWidth as number | string;
  if (style.maxWidth != null) result.maxWidth = style.maxWidth as number | string;
  if (style.minHeight != null) result.minHeight = style.minHeight as number | string;
  if (style.maxHeight != null) result.maxHeight = style.maxHeight as number | string;
  if (style.aspectRatio != null) result.aspectRatio = style.aspectRatio as number;

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
 * shallowEqualYogaStyle — So sánh 2 styles để xác định layout có thay đổi không.
 * Dùng trong prepareUpdate để tránh commitUpdate thừa.
 */
function shallowEqualYogaStyle(a?: ViewStyle, b?: ViewStyle): boolean {
  const keys: (keyof ViewStyle)[] = [
    'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'flexDirection',
    'justifyContent', 'alignItems', 'alignSelf', 'alignContent', 'flexWrap',
    'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'paddingHorizontal', 'paddingVertical', 'padding',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'marginHorizontal', 'marginVertical', 'margin',
    'position', 'top', 'left', 'right', 'bottom',
    'gap', 'rowGap', 'columnGap', 'aspectRatio', 'display', 'overflow',
  ];
  for (const k of keys) {
    if ((a as any)?.[k] !== (b as any)?.[k]) return false;
  }
  return true;
}

// ── Host Config (base) ────────────────────────────────────────────────────────

/**
 * baseHostConfig — Tất cả hostConfig methods không cần per-canvas closure.
 * createSkiaKitHostConfig() spread object này và override resetAfterCommit.
 *
 * Type params: Container = { canvasId: string }, Instance = string (nodeId)
 */
const baseHostConfig = {
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: false, // Coexist với React Native renderer

  // ── Scheduling ────────────────────────────────────────────────────────────
  getCurrentUpdatePriority() { return DefaultEventPriority; },
  resolveUpdatePriority() { return DefaultEventPriority; },
  setCurrentUpdatePriority() {},
  resolveEventTimeStamp() { return Date.now(); },
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  warnsIfNotActing: true,
  resolveEventType() { return null; },
  resolveEventPriority() { return DefaultEventPriority; },
  requestPostPaintCallback() {},
  trackSchedulerEvent() {},
  trackSchedulerEventInDEV() {},
  detachDeletedInstance() {},
  shouldAttemptEagerTransition() { return false; },

  // ── React 19: Commit suspension (must all return false/null for custom renderers) ──
  // These are NEW in React 19. If missing, React calls undefined() → TypeError → commit aborts.
  maySuspendCommit(_type: string, _props: any) { return false; },
  maySuspendCommitOnUpdate(_type: string, _oldProps: any, _newProps: any) { return false; },
  maySuspendCommitInSyncRender(_type: string, _props: any) { return false; },
  preloadInstance(_type: string, _props: any) { return true; }, // true = already loaded
  startSuspendingCommit() {},
  suspendInstance(_type: string, _props: any) {},
  waitForCommitToBeReady() { return null; }, // null = not suspending

  // ── React 19: Microtask scheduling ────────────────────────────────────────
  supportsMicrotasks: true,
  scheduleMicrotask: queueMicrotask,

  // ── React 19: getSuspendedCommitReason (for debugging) ────────────────────
  getSuspendedCommitReason() { return null; },



  // ── Node creation ─────────────────────────────────────────────────────────

  /**
   * createInstance — Tạo C++ node khi Reconciler mount component.
   * Trả về nodeId (string) — Reconciler dùng làm `instance` trong toàn bộ lifecycle.
   *
   * Quan trọng: mỗi type map sang một C++ node type khác nhau.
   * Fallback (Column/Row/Scaffold/...): transparent BoxNode để giữ cây không bị gãy.
   */
  createInstance(
    type: string,
    props: any,
    _rootContainer: { canvasId: string },
    _hostContext: { canvasId: string }
  ): string {
    const id: string = props.id || `w_${Math.random().toString(36).substr(2, 9)}`;
    const yogaStyle = buildNativeStyle(props.style);

    switch (type) {
      case 'Box': {
        const overflowHidden = props.style?.overflow === 'hidden';
        const bgColor = parseColor(props.style?.backgroundColor);
        if (__DEV__ && bgColor !== 0) {
          console.log(`[SkiaKit Box] id=${id} bg=0x${bgColor.toString(16)} raw="${props.style?.backgroundColor}" borderRadius=${props.style?.borderRadius}`);
        }
        uiEngine.createBoxNode(id, yogaStyle, {
          backgroundColor: bgColor,
          borderRadius: props.style?.borderRadius ?? 0,
          borderWidth: props.style?.borderWidth ?? 0,
          borderColor: parseColor(props.style?.borderColor),
          elevation: props.elevation ?? 0,
          overflowHidden,
        });
        // Register HitTest ONLY if interactive
        if (isInteractive(props) || props.hitTestBehavior) {
          const zIndex = props.style?.zIndex ?? 0;
          const behavior = props.hitTestBehavior === 'opaque' ? 1 : 0;
          uiEngine.registerWidget(id, 0, 0, 0, 0, zIndex, behavior);
        }
        break;
      }

      case 'Text': {
        const fontWeight = typeof props.style?.fontWeight === 'string'
          ? (parseInt(props.style.fontWeight, 10) || 400)
          : (props.style?.fontWeight ?? 400);
        uiEngine.createTextNode(id, yogaStyle, {
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
          uiEngine.registerWidget(id, 0, 0, 0, 0, zIndex, behavior);
        }
        break;
      }

      case 'Image': {
        const src = props.src ?? props.source?.uri ?? props.uri ?? '';
        uiEngine.createImageNode(id, src);
        // Phase 6E: C++ fetches image data natively via RNSkPlatformContext
        uiEngine.startImageLoad(id);
        if (isInteractive(props)) {
          const zIndex = props.style?.zIndex ?? 0;
          uiEngine.registerWidget(id, 0, 0, 0, 0, zIndex, 0);
        }
        break;
      }

      case 'Icon': {
        const isStroke = props.pathStyle === 'stroke';
        uiEngine.createIconNode(
          id,
          yogaStyle,
          props.pathStr || '',
          parseColor(props.color),
          isStroke,
          props.strokeWidth ?? 2
        );
        if (isInteractive(props)) {
          const zIndex = props.style?.zIndex ?? 0;
          uiEngine.registerWidget(id, 0, 0, 0, 0, zIndex, 0);
        }
        break;
      }

      case 'Scroll': {
        uiEngine.createScrollNode(id, props.horizontal ?? false);
        uiEngine.registerScrollArea(id, 0, 0, 0, 0, props.horizontal ?? false);
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
        uiEngine.createBoxNode(id, yogaStyle, {
          backgroundColor: parseColor(props.style?.backgroundColor),
          borderRadius: props.style?.borderRadius ?? 0,
          borderWidth: props.style?.borderWidth ?? 0,
          borderColor: parseColor(props.style?.borderColor),
          elevation: props.elevation ?? 0,
          overflowHidden: props.style?.overflow === 'hidden',
        });
        if (isInteractive(props) || props.hitTestBehavior) {
          const zIndex = props.style?.zIndex ?? 0;
          const behavior = props.hitTestBehavior === 'opaque' ? 1 : 0;
          uiEngine.registerWidget(id, 0, 0, 0, 0, zIndex, behavior);
        }
        break;
      }

      default: {
        // Fallback: unknown types (skGroup, etc.) → transparent BoxNode
        uiEngine.createBoxNode(id, yogaStyle, {
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
      console.log(`[SkiaKit Reconciler] createInstance type=${type} id=${id}`);
    }
    return id;
  },

  /**
   * createTextInstance — Xử lý plain text string trong JSX.
   * Ví dụ: <Box>Hello {name}</Box> → tự động wrap thành TextNode.
   */
  createTextInstance(text: string, _rootContainer: any): string {
    const id = `t_${Math.random().toString(36).substr(2, 9)}`;
    uiEngine.createTextNode(id, {}, {
      content: text,
      fontSize: 14,
      color: 0xFF000000,
      fontFamily: '',
      fontWeight: 400,
      numberOfLines: 0,
    });
    return id;
  },

  // ── Tree manipulation ─────────────────────────────────────────────────────

  appendInitialChild(parentId: string, childId: string) {
    if (__DEV__) console.log(`[SkiaKit Reconciler] appendInitialChild parent=${parentId} child=${childId}`);
    uiEngine.addRenderChild(parentId, childId);
  },
  appendChild(parentId: string, childId: string) {
    if (__DEV__) console.log(`[SkiaKit Reconciler] appendChild parent=${parentId} child=${childId}`);
    uiEngine.addRenderChild(parentId, childId);
  },
  appendChildToContainer(containerInfo: { canvasId: string }, childId: string) {
    if (__DEV__) console.log(`[SkiaKit Reconciler] appendChildToContainer canvas=${containerInfo.canvasId} child=${childId}`);
    uiEngine.addRenderChild(containerInfo.canvasId, childId);
  },

  removeChild(parentId: string, childId: string) {
    uiEngine.removeRenderChild(parentId, childId);
    uiEngine.removeRenderNode(childId); // Recursive cleanup trong C++
    uiEngine.unregisterWidget(childId);
    unregisterJSCallbacks(childId);
  },
  removeChildFromContainer(containerInfo: { canvasId: string }, childId: string) {
    uiEngine.removeRenderChild(containerInfo.canvasId, childId);
    uiEngine.removeRenderNode(childId);
    uiEngine.unregisterWidget(childId);
    unregisterJSCallbacks(childId);
  },

  insertBefore(parentId: string, childId: string, _beforeChildId: string) {
    // C++ addChild append — không hỗ trợ insert at index hiện tại.
    // Reconciler sẽ reorder bằng remove + re-append nếu thứ tự thay đổi.
    uiEngine.addRenderChild(parentId, childId);
  },
  insertInContainerBefore(containerInfo: { canvasId: string }, childId: string, _beforeChildId: string) {
    uiEngine.addRenderChild(containerInfo.canvasId, childId);
  },

  // ── Update ────────────────────────────────────────────────────────────────

  /**
   * prepareUpdate — Diff props và trả về update payload.
   * Trả về null nếu không có thay đổi → commitUpdate bị bỏ qua hoàn toàn.
   *
   * Tối ưu: tránh JSI call thừa khi state thay đổi nhưng visual/layout không đổi.
   */
  prepareUpdate(_id: string, type: string, oldProps: any, newProps: any) {
    if (type === 'Box') {
      const visualChanged =
        oldProps.style?.backgroundColor !== newProps.style?.backgroundColor ||
        oldProps.style?.borderRadius !== newProps.style?.borderRadius ||
        oldProps.style?.borderWidth !== newProps.style?.borderWidth ||
        oldProps.style?.borderColor !== newProps.style?.borderColor ||
        oldProps.style?.overflow !== newProps.style?.overflow ||
        oldProps.elevation !== newProps.elevation;
      const layoutChanged = !shallowEqualYogaStyle(oldProps.style, newProps.style);
      const interactionChanged =
        oldProps.hitTestBehavior !== newProps.hitTestBehavior ||
        isInteractive(oldProps) !== isInteractive(newProps);
      if (!visualChanged && !layoutChanged && !interactionChanged) return null;
      return { type };
    }
    if (type === 'Text') {
      const contentChanged =
        (oldProps.text ?? oldProps.children) !== (newProps.text ?? newProps.children) ||
        oldProps.numberOfLines !== newProps.numberOfLines;
      const styleChanged =
        oldProps.style?.fontSize !== newProps.style?.fontSize ||
        oldProps.style?.color !== newProps.style?.color ||
        oldProps.style?.fontFamily !== newProps.style?.fontFamily ||
        oldProps.style?.fontWeight !== newProps.style?.fontWeight;
      const layoutChanged = !shallowEqualYogaStyle(oldProps.style, newProps.style);
      if (!contentChanged && !styleChanged && !layoutChanged) return null;
      return { type };
    }
    if (type === 'Icon') {
      const changed =
        oldProps.pathStr !== newProps.pathStr ||
        oldProps.color !== newProps.color ||
        oldProps.pathStyle !== newProps.pathStyle ||
        oldProps.strokeWidth !== newProps.strokeWidth ||
        !shallowEqualYogaStyle(oldProps.style, newProps.style);
      if (!changed) return null;
      return { type };
    }
    if (type === 'Image') {
      const srcOld = oldProps.src ?? oldProps.source?.uri ?? oldProps.uri ?? '';
      const srcNew = newProps.src ?? newProps.source?.uri ?? newProps.uri ?? '';
      if (srcOld === srcNew) return null;
      return { type };
    }
    if (type === 'Scroll') {
      const changed = oldProps.horizontal !== newProps.horizontal;
      if (!changed) return null;
      return { type };
    }
    // Fallback types: check layout only
    if (!shallowEqualYogaStyle(oldProps.style, newProps.style)) return { type };
    return null;
  },

  /**
   * commitUpdate — Cập nhật C++ node khi props thay đổi.
   * Chỉ chạy khi prepareUpdate trả về non-null payload.
   */
  commitUpdate(
    id: string,
    _updatePayload: any,
    type: string,
    _oldProps: any,
    newProps: any
  ) {
    const yogaStyle = buildNativeStyle(newProps.style);

    switch (type) {
      case 'Box': {
        uiEngine.updateBoxNode(id, yogaStyle, {
          backgroundColor: parseColor(newProps.style?.backgroundColor),
          borderRadius: newProps.style?.borderRadius ?? 0,
          borderWidth: newProps.style?.borderWidth ?? 0,
          borderColor: parseColor(newProps.style?.borderColor),
          elevation: newProps.elevation ?? 0,
          overflowHidden: newProps.style?.overflow === 'hidden',
        });
        // Update HitTestSubsystem registration khi interactivity thay đổi
        if (isInteractive(newProps) || newProps.hitTestBehavior) {
          const zIndex = newProps.style?.zIndex ?? 0;
          const behavior = newProps.hitTestBehavior === 'opaque' ? 1 : 0;
          uiEngine.registerWidget(id, 0, 0, 0, 0, zIndex, behavior);
        } else {
          uiEngine.unregisterWidget(id);
        }
        break;
      }

      case 'Text': {
        const fontWeight = typeof newProps.style?.fontWeight === 'string'
          ? (parseInt(newProps.style.fontWeight, 10) || 400)
          : (newProps.style?.fontWeight ?? 400);
        uiEngine.updateTextNode(id, yogaStyle, {
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
        uiEngine.updateIconNode(
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
        // Image src changed → recreate (không có updateImageNode trong C++)
        const src = newProps.src ?? newProps.source?.uri ?? newProps.uri ?? '';
        uiEngine.createImageNode(id, src);
        uiEngine.startImageLoad(id);
        break;
      }

      case 'Scroll':
        // ScrollNode không có visual update — horizontal không thể thay đổi sau khi tạo.
        // Chỉ cần update yoga style nếu dimension thay đổi.
        // C++ side: không có updateScrollNode → skip.
        break;

      // ── Layout container aliases ──────────────────────────────────────────
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
        uiEngine.updateBoxNode(id, yogaStyle, {
          backgroundColor: parseColor(newProps.style?.backgroundColor),
          borderRadius: newProps.style?.borderRadius ?? 0,
          borderWidth: newProps.style?.borderWidth ?? 0,
          borderColor: parseColor(newProps.style?.borderColor),
          elevation: newProps.elevation ?? 0,
          overflowHidden: newProps.style?.overflow === 'hidden',
        });
        break;
      }

      default: {
        // Fallback BoxNode — cập nhật layout và visual style
        uiEngine.updateBoxNode(id, yogaStyle, {
          backgroundColor: parseColor(newProps.style?.backgroundColor) ?? 0,
          borderRadius: newProps.style?.borderRadius ?? 0,
          borderWidth: newProps.style?.borderWidth ?? 0,
          borderColor: parseColor(newProps.style?.borderColor) ?? 0,
          elevation: newProps.elevation ?? 0,
          overflowHidden: newProps.style?.overflow === 'hidden',
        });
        break;
      }
    }

    registerJSCallbacks(id, newProps);
  },

  // ── Context ───────────────────────────────────────────────────────────────

  /**
   * getRootHostContext — canvasId được forward xuống toàn cây thông qua hostContext.
   * createInstance có thể đọc canvasId từ hostContext nếu cần.
   */
  getRootHostContext(rootContainerId: { canvasId: string }) {
    return { canvasId: rootContainerId.canvasId };
  },
  getChildHostContext(parentCtx: { canvasId: string }) {
    return parentCtx; // Truyền xuống nguyên vẹn
  },

  // ── Commit lifecycle ──────────────────────────────────────────────────────

  /**
   * prepareForCommit — Gọi trước khi batch commit bắt đầu.
   * Phải trả về containerInfo để resetAfterCommit nhận được.
   */
  prepareForCommit(containerInfo: { canvasId: string }) {
    return containerInfo; // [FIX] Must return containerInfo, not void
  },

  /**
   * resetAfterCommit — Gọi SAU khi toàn bộ batch commit hoàn tất.
   * Đây là nơi trigger 1 lần rebuild SkPicture per batch (không phải per node).
   *
   * Override trong createSkiaKitHostConfig để inject requestRedraw closure.
   */
  resetAfterCommit(_containerInfo: { canvasId: string }) {
    // Override bởi createSkiaKitHostConfig — đây là no-op mặc định
  },

  // ── Misc lifecycle ────────────────────────────────────────────────────────

  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,
  clearContainer: () => {},
  getCurrentEventPriority: () => DefaultEventPriority,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  preparePortalMount() {},
} as const;

// ── Factory per CanvasRoot ────────────────────────────────────────────────────

/**
 * createSkiaKitHostConfig — Tạo hostConfig mới hoàn toàn per CanvasRoot.
 * Mỗi CanvasRoot có closure riêng biệt → không conflict state.
 *
 * requestRedraw: callback từ CanvasRoot để trigger:
 *   1. uiEngine.calculateLayout(canvasId, w, h)
 *   2. uiEngine.drawTree(canvasId, w, h)
 *   3. getRootPicture() → Skia.Picture.MakePicture() → SkiaPictureView.redraw()
 *
 * Pattern này match Phase 6E trong architecture doc:
 *   resetAfterCommit → markDirty → requestRedraw → rebuildPicture (1 lần per batch)
 */
export function createSkiaKitHostConfig(requestRedraw: () => void) {
  return {
    ...baseHostConfig,
    resetAfterCommit(containerInfo: { canvasId: string }) {
      if (containerInfo?.canvasId) {
        uiEngine.markDirty(containerInfo.canvasId);
        requestRedraw(); // Per-canvas closure — không conflict với canvas khác
      }
    },
  };
}

// Singleton Reconciler với baseHostConfig (common case: 1 CanvasRoot)
// CanvasRoot thực tế tạo Reconciler riêng qua createSkiaKitHostConfig để có requestRedraw.
export const SkiaKitReconciler = Reconciler(baseHostConfig as any);
