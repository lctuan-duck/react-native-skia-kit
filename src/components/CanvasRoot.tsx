import * as React from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import Reconciler from 'react-reconciler';

import { useWindowDimensions, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  GestureDetector as RNGestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { runOnUI } from 'react-native-reanimated';
import { useOverlayStore } from '../stores/overlayStore';
import { WidgetContext } from '../core/WidgetContext';
import { EngineContext } from '../core/EngineContext';
import { NitroModules } from 'react-native-nitro-modules';
import type { UIEngine } from '../nitro/UIEngine.nitro';

import { createSkiaKitHostConfig } from '../core/SkiaKitReconciler';
import { updateLayoutSVs } from '../stores/layoutRegistry';
import SkiaKitNativeView from './SkiaKitNativeView';


/**
 * Props for CanvasRoot — the root container for a Skia-powered UI tree.
 */
interface CanvasRootProps {
  /**
   * Style for the outer React Native View wrapper.
   * Use `width`/`height` or `flex` to size the canvas.
   * @example style={{ flex: 1 }}
   */
  style?: ViewStyle;

  /**
   * Unique identifier for this canvas instance.
   * Used internally as the root node ID for the C++ render tree.
   * Multiple `CanvasRoot`s must have different `canvasId` values.
   * @default 'main'
   */
  canvasId?: string;

  /**
   * SkiaKit widget tree to render.
   * Use SkiaKit components (`Box`, `Text`, `Button`, `Slider`, etc.) here.
   * Standard React Native components are NOT supported inside CanvasRoot.
   */
  children?: React.ReactNode;
}

/**
 * CanvasRoot — Root container for a SkiaKit UI tree.
 *
 * ## What it does
 *
 * Mounts a hardware-accelerated GPU canvas (OpenGL on Android, Metal on iOS)
 * and manages a C++ autonomous render engine. All child SkiaKit components
 * are rendered by Skia directly — no React Native bridge involved in the
 * draw path.
 *
 * ## Architecture (Phase 3+)
 *
 * ```
 * <CanvasRoot>                     // React component
 *   ↓  SkiaKitReconciler           // custom React reconciler
 *   ↓  C++ createBoxNode/TextNode  // Nitro JSI, synchronous
 *   ↓  resetAfterCommit            // scheduleLayoutAndRender()
 *   ↓  HybridUIEngine (C++)
 *      ├── calculateLayout()       // Yoga — CSS Flexbox
 *      ├── syncLayoutResults()     // → RenderSubsystem
 *      ├── updateWidgetLayout()    // → HitTestSubsystem (touch)
 *      ├── _layoutUpdateCallback() // → JS: updateLayoutSVs()
 *      └── drawTreeDirect()        // → GPU surface flush
 * ```
 *
 * ## Multi-instance
 *
 * Each `CanvasRoot` creates its own isolated `HybridUIEngine` with a unique
 * `_engineId`. Multiple canvases render independently without cross-contamination:
 *
 * ```jsx
 * <View style={{ flex: 1 }}>
 *   <CanvasRoot canvasId="map" style={{ height: 300 }}>
 *     <MapWidget />
 *   </CanvasRoot>
 *   <CanvasRoot canvasId="chart" style={{ height: 200 }}>
 *     <ChartWidget />
 *   </CanvasRoot>
 * </View>
 * ```
 *
 * ## Performance (Phase 6)
 *
 * The C++ renderer applies 3 optimization layers:
 * - **Frame dedup**: Skips GPU flush when picture hasn't changed
 * - **Value dedup**: Skips `rebuildPicture` when animated values are identical
 * - **Dirty rect culling**: Only rasterizes changed regions (via Skia BBH)
 *
 * ## Worklet-native layout access (Phase 5)
 *
 * Use `useLayoutSharedValues(widgetId)` in animation worklets to read
 * Yoga-computed layout directly without JS thread round-trips:
 *
 * ```ts
 * const layoutSVs = useLayoutSharedValues(widgetId);
 * useAnimatedReaction(
 *   () => progress.value,
 *   (p) => {
 *     'worklet';
 *     const fw = layoutSVs.width.value; // always fresh — no re-registration
 *     direct(fillId, { width: p * fw });
 *   },
 *   [fillId] // layoutSVs.width is stable — NOT needed in deps
 * );
 * ```
 */
export const CanvasRoot = React.memo(function CanvasRoot({
  style,
  canvasId = 'main',
  children,
}: CanvasRootProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // BUG-2 Fix: đọc overlays theo canvasId — mỗi CanvasRoot chỉ hiển overlay của mình.
  // INFINITE-LOOP FIX: chọn raw Map (stable ref khi không có thay đổi) thay vì gọi
  // getOverlays() (tạo array mới mỗi call → useSyncExternalStore báo "getSnapshot not cached").
  const rawCanvasOverlays = useOverlayStore((s) => s.overlaysByCanvas.get(canvasId));
  const sortedOverlays = useMemo(() => {
    const entries = Array.from(rawCanvasOverlays?.values() ?? []);
    return entries.sort((a, b) => a.zIndex - b.zIndex);
  }, [rawCanvasOverlays]);

  // Phase 4: per-instance engine — mỗi CanvasRoot tạo 1 UIEngine riêng
  // Thay thế GlobalEngine singleton. Engine bị destroy khi CanvasRoot unmount.
  const engine = useMemo<UIEngine>(
    () => NitroModules.createHybridObject<UIEngine>('UIEngine'),
    [] // tạo 1 lần khi mount
  );

  // Phase 3: engineId cho SkiaKitNativeView multi-instance lookup
  const engineId = useMemo(() => engine.getEngineId(), [engine]);

  // CONTEXT-STABILITY FIX: memoize để tránh tạo object mới mỗi render.
  // { engine, engineId } inline trong JSX sẽ tạo object mới mỗi render
  // → tất cả consumer của EngineContext sẽ re-render không cần thiết.
  const engineContextValue = useMemo(() => ({ engine, engineId }), [engine, engineId]);

  // ── requestRedraw — Phase 3: C++ tự layout + render + notify JS ───────────
  //
  // C++ đảm nhận: calculateLayout, hitTest sync, render → GPU surface.
  // Sau layout cycle, C++ notify JS qua onLayoutComplete callback → updateLayoutSVs.
  const requestRedraw = useCallback(() => {
    engine.scheduleLayoutAndRender();
  }, [engine]);

  // ── Globals + onLayoutComplete registration ──────────────────────────────
  const requestRedrawRef = useRef(requestRedraw);
  requestRedrawRef.current = requestRedraw;

  useLayoutEffect(() => {
    // Phase 3: C++ push layout results đến JS sau mỗi layout cycle
    engine.onLayoutComplete(() => {
      const layouts = engine.getAllLayouts();
      if (layouts) {
        updateLayoutSVs(
          layouts as Record<string, { x: number; y: number; width: number; height: number }>
        );
      }
    });

    // BUG-1 Fix: Multi-instance safe worklet engine registry.
    // Thay vì gán 1 global function duy nhất (sẽ bị overwrite khi có 2 CanvasRoot),
    // dùng map: global.skiaKitEngines[engineId] = boxedEngine.
    // Mỗi component đọc đúng engine của mình qua engineId.
    const boxedEngine = NitroModules.box(engine);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runOnUI((eid: number, boxed: any) => {
      'worklet';
      if (!(global as any).skiaKitEngines) {
        (global as any).skiaKitEngines = {};
      }
      (global as any).skiaKitEngines[eid] = boxed;
      // Backward-compat: nếu chỉ có 1 CanvasRoot, vẫn set global shortcut
      // Sẽ bị overwrite bởi CanvasRoot mount sau, nhưng đây là expected
      // behavior khi chỉ có 1 canvas (case phổ biến nhất).
      (global as any).skiaKitLastEngineId = eid;
    })(engineId, boxedEngine);

    // Cleanup worklet engine registry khi unmount
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runOnUI((eid: number) => {
        'worklet';
        if ((global as any).skiaKitEngines) {
          delete (global as any).skiaKitEngines[eid];
        }
        if ((global as any).skiaKitLastEngineId === eid) {
          (global as any).skiaKitLastEngineId = undefined;
        }
      })(engineId);
    };
  }, [engine, engineId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── requestRedraw stable ref for Reconciler ────────────────────────────────
  const stableRequestRedraw = useRef(() => {
    requestRedrawRef.current();
  }).current;

  // ── Custom Reconciler per CanvasRoot ──────────────────────────────────────
  const hostConfigRef = useRef<ReturnType<
    typeof createSkiaKitHostConfig
  > | null>(null);
  const reconcilerRef = useRef<ReturnType<typeof Reconciler> | null>(null);
  const containerRef = useRef<any>(null);

  if (!hostConfigRef.current) {
    hostConfigRef.current = createSkiaKitHostConfig(engine, stableRequestRedraw);
    reconcilerRef.current = Reconciler(hostConfigRef.current as any);
  }

  const reconciler = reconcilerRef.current!;

  if (!containerRef.current) {
    // 0. Cleanup: xóa debug/stale nodes từ session trước
    try { engine.removeRenderNode('_dbg_box_'); } catch { /* ignore */ }
    try { engine.removeRenderNode(canvasId); } catch { /* first mount */ }

    // 1. Tạo Root BoxNode trong C++
    engine.createBoxNode(
      canvasId,
      { flex: 1, width: screenWidth, height: screenHeight },
      {
        backgroundColor: 0, // transparent root
        borderRadius: 0,
        borderWidth: 0,
        borderColor: 0,
        elevation: 0,
        overflowHidden: false,
      }
    );

    // 2. Tạo React Reconciler container — containerInfo mang cả canvasId + engine
    containerRef.current = reconciler.createContainer(
      { canvasId, engine }, // containerInfo — engine dùng bởi reconciler lifecycle
      1, // ConcurrentRoot (React 19 Fabric)
      null, // hydrationCallbacks
      false, // isStrictMode
      null, // concurrentUpdatesByDefaultOverride
      '', // identifierPrefix
      (error: unknown) => {
        console.error('[SkiaKit] onUncaughtError:', error);
      }, // onUncaughtError
      (error: unknown) => {
        console.error('[SkiaKit] onCaughtError:', error);
      }, // onCaughtError
      (error: unknown) => {
        console.warn('[SkiaKit] onRecoverableError:', error);
      }, // onRecoverableError
      () => {} // onDefaultTransitionIndicator
    );

    // 3. Validate C++ engine sẵn sàng
    engine.initRenderEngine();
  }

  // ── overlays ref: tránh useLayoutEffect chạy lại do array reference mới
  const sortedOverlaysRef = useRef(sortedOverlays);
  sortedOverlaysRef.current = sortedOverlays;

  // Render children tree thông qua custom Reconciler
  // Dùng useLayoutEffect KHÔNG có sortedOverlays trong deps để tránh infinite loop.
  // sortedOverlays được đọc qua ref. children là stable (memoized bởi parent).
  useLayoutEffect(() => {
    // SECONDARY-RECONCILER CONTEXT FIX:
    // React context từ primary renderer tree KHÔNG tự động có trong secondary reconciler tree.
    // Cần wrap skiaChildren với các context providers để components (TabBar, Button...)
    // có thể gọi useEngineContext() / useCanvasId() khi render trong secondary reconciler.
    // ROOT CAUSE: secondary reconciler createContainer(node, ..., null, ...) — parentComponent=null
    // → context từ primary renderer tree KHÔNG propagate vào secondary reconciler.
    // FIX: wrap skiaChildren với EngineContext.Provider để useEngineContext() work.
    // QUAN TRỌNG: KHÔNG thêm WidgetContext.Provider — Box đọc WidgetContext để biết parent ID
    // và gọi engine.addChildNode(). Nếu add provider, Box double-register (host config + context)
    // → gây lỗi cây C++ và màn hình trắng.
    const skiaChildren = (
      <EngineContext.Provider value={engineContextValue}>
        {children}
        {sortedOverlaysRef.current.map((o) => (
          <React.Fragment key={o.id}>{o.node}</React.Fragment>
        ))}
      </EngineContext.Provider>
    );


    // React 19: cần force sync commit cho secondary renderer.
    // Pattern từ React source (scheduleRefresh): updateContainerSync + flushSyncWork
    const rec = reconciler as any;
    const hasSync = typeof rec.updateContainerSync === 'function';
    const hasFlushSync = typeof rec.flushSyncWork === 'function';
    const hasFlushFromRec = typeof rec.flushSyncFromReconciler === 'function';


    if (hasSync && hasFlushFromRec) {
      // Pattern 1: flushSyncFromReconciler wraps updateContainerSync
      // (sets BatchedContext trước để scheduler recognize work)
      rec.flushSyncFromReconciler(() => {
        rec.updateContainerSync(skiaChildren, containerRef.current, null, null);
      });
      stableRequestRedraw();
    } else if (hasSync && hasFlushSync) {
      // Pattern 2: updateContainerSync + flushSyncWork (from scheduleRefresh source)
      rec.updateContainerSync(skiaChildren, containerRef.current, null, null);
      rec.flushSyncWork();
      stableRequestRedraw();
    } else {
      // Fallback: legacy updateContainer (React 18 / non-concurrent)
      reconciler.updateContainer(
        skiaChildren,
        containerRef.current,
        null as any,
        () => {
          stableRequestRedraw();
        }
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, reconciler, engineContextValue]); // sortedOverlays intentionally via ref

  // Re-run layout khi screen thay đổi
  React.useEffect(() => {
    if (containerRef.current) {
      engine.resize(screenWidth, screenHeight);
      engine.updateBoxNode(
        canvasId,
        { flex: 1, width: screenWidth, height: screenHeight },
        { backgroundColor: 0, borderRadius: 0, borderWidth: 0, borderColor: 0, elevation: 0, overflowHidden: false }
      );
      queueMicrotask(() => requestRedrawRef.current());
    }
  }, [screenWidth, screenHeight, canvasId, engine]);

  // BUG-0 Fix: Cleanup reconciler và C++ engine khi CanvasRoot unmount.
  // Trước đây chỉ gọi detachNativeView() nhưng không unmount React reconciler tree
  // → nodeToEngine Map giữ tất cả references → C++ Engine/GPU Surface bị leak.
  //
  // Fix: gọi updateContainer(null) để reconciler chạy removeChild cho toàn bộ
  // cây con → recursiveUnregister() dọn sạch nodeToEngine + jsCallbacks.
  // Sau đó removeRenderNode(canvasId) dọn root C++ node.
  React.useEffect(() => {
    const rec = reconcilerRef.current as any;
    const container = containerRef.current;
    const currentEngine = engine;
    const currentCanvasId = canvasId;
    return () => {
      // 1. Unmount toàn bộ React reconciler tree → triggers recursiveUnregister
      try {
        if (rec && container) {
          if (typeof rec.updateContainerSync === 'function') {
            rec.updateContainerSync(null, container, null, null);
          } else {
            rec.updateContainer(null, container, null, null);
          }
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      // 2. Remove root C++ node
      try { currentEngine.removeRenderNode(currentCanvasId); } catch { /* ignore */ }
      // 3. Detach native GPU surface
      currentEngine.detachNativeView();
      // 4. BUG-2 Fix: xóa tất cả overlays của canvas này khỏi store
      // Tránh ghost overlays sau khi navigate ra khỏi màn hình
      useOverlayStore.getState().clearAll(currentCanvasId);
    };
  }, [engine, canvasId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Use plain useRef — NOT useSharedValue — for active gesture ID tracking.
  // Reanimated SharedValue.value writes are async on New Arch (Fabric):
  // writing .value then immediately reading it returns the OLD value on JS thread.
  // This caused pan gestures to silently fail (globalActivePanId always appeared empty).
  const globalActivePressIdRef = React.useRef('');
  const globalActivePanIdRef = React.useRef('');

  const triggerJSCallback = React.useCallback(
    (id: string, type: string, args: any = {}) => {
      const { getJSCallbacks } = require('../core/SkiaKitReconciler');
      const cbs = getJSCallbacks(id);
      if (!cbs) return false;

      let handled = false;
      switch (type) {
        case 'press':
          if (cbs.onPress) {
            cbs.onPress(args.x, args.y);
            handled = true;
          }
          break;
        case 'pressIn':
          if (cbs.onPressIn || cbs.onPress) {
            cbs.onPressIn?.(args.x, args.y);
            handled = true;
          }
          break;
        case 'pressOut':
          if (cbs.onPressOut || cbs.onPress) {
            cbs.onPressOut?.(args.x, args.y);
            handled = true;
          }
          break;
        case 'longPress':
          if (cbs.onLongPress) {
            cbs.onLongPress();
            handled = true;
          }
          break;
        case 'panStart':
          if (cbs.onPanStart) {
            cbs.onPanStart(args);
            handled = true;
          }
          break;
        case 'panUpdate':
          if (cbs.onPanUpdate) {
            cbs.onPanUpdate(args);
            handled = true;
          }
          break;
        case 'panEnd':
          if (cbs.onPanEnd) {
            cbs.onPanEnd(args);
            handled = true;
          }
          break;
      }
      return handled;
    },
    []
  );

  // ── Tap + LongPress gesture (mutually exclusive) ────────────────────────
  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(300)
    .onBegin((e) => {
      const hits = engine.hitTest(e.x, e.y);
      for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i]!;
        const handled = triggerJSCallback(hit.id, 'pressIn', {
          x: hit.localX,
          y: hit.localY,
        });
        if (handled) {
          globalActivePressIdRef.current = hit.id;
          break;
        }
      }
    })
    .onEnd((e) => {
      const hits = engine.hitTest(e.x, e.y);
      for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i]!;
        if (hit.id === globalActivePressIdRef.current) {
          const handled = triggerJSCallback(hit.id, 'press', {
            x: hit.localX,
            y: hit.localY,
          });
          if (handled) break;
        }
      }
    })
    .onFinalize(() => {
      if (globalActivePressIdRef.current) {
        triggerJSCallback(globalActivePressIdRef.current, 'pressOut', {});
        globalActivePressIdRef.current = '';
      }
    });

  const longPressGesture = Gesture.LongPress()
    .runOnJS(true)
    .onStart((e) => {
      const hits = engine.hitTest(e.x, e.y);
      for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i]!;
        const handled = triggerJSCallback(hit.id, 'longPress', {});
        if (handled) break;
      }
    });

  // ── Pan gesture (scroll/drag) ────────────────────────────────────────────
  // TÁCH BIỆT khỏi Tap/LongPress để tránh "Can't cancel already finished gesture".
  // Gesture.Simultaneous(Tap, Pan) → khi Pan active, Tap nhận UP event → conflict.
  // Fix: Pan độc lập, minDistance=5 để phân biệt với tap tự nhiên.
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      globalActivePanIdRef.current = ''; // Reset state mỗi lần start mới
      const hits = engine.hitTest(e.x, e.y);
      for (let i = hits.length - 1; i >= 0; i--) {
        const hit = hits[i]!;
        const ev = {
          translationX: 0,
          translationY: 0,
          velocityX: 0,
          velocityY: 0,
          absoluteX: e.absoluteX,
          absoluteY: e.absoluteY,
          localX: hit.localX,
          localY: hit.localY,
          state: 2,
        };
        const handled = triggerJSCallback(hit.id, 'panStart', ev);
        if (handled) {
          globalActivePanIdRef.current = hit.id;
          break;
        }
      }
    })
    .onUpdate((e) => {
      if (globalActivePanIdRef.current) {
        const ev = {
          translationX: e.translationX,
          translationY: e.translationY,
          velocityX: e.velocityX,
          velocityY: e.velocityY,
          absoluteX: e.absoluteX,
          absoluteY: e.absoluteY,
          localX: 0,
          localY: 0,
          state: 4,
        };
        triggerJSCallback(globalActivePanIdRef.current, 'panUpdate', ev);
      }
    })
    .onEnd((e) => {
      if (globalActivePanIdRef.current) {
        const ev = {
          translationX: e.translationX,
          translationY: e.translationY,
          velocityX: e.velocityX,
          velocityY: e.velocityY,
          absoluteX: e.absoluteX,
          absoluteY: e.absoluteY,
          localX: 0,
          localY: 0,
          state: 5,
        };
        triggerJSCallback(globalActivePanIdRef.current, 'panEnd', ev);
        globalActivePanIdRef.current = '';
      }
    })
    .onFinalize(() => {
      // Đảm bảo state luôn được clean kể cả khi gesture bị cancel/interrupted
      if (globalActivePanIdRef.current) {
        triggerJSCallback(globalActivePanIdRef.current, 'panEnd', {
          translationX: 0, translationY: 0,
          velocityX: 0, velocityY: 0,
          absoluteX: 0, absoluteY: 0,
          localX: 0, localY: 0,
          state: 6, // CANCELLED
        });
        globalActivePanIdRef.current = '';
      }
    });

  // Race: nếu Pan activate trước → cancel Tap/LongPress (và ngược lại)
  // Tránh conflict "Can't cancel already finished gesture" từ Simultaneous.
  const gesture = Gesture.Race(
    panGesture,
    Gesture.Simultaneous(tapGesture, longPressGesture)
  );

  return (
    <EngineContext.Provider value={engineContextValue}>
      <WidgetContext.Provider value={canvasId}>
        <RNGestureDetector gesture={gesture}>
          {/* Phase 3: SkiaKitNativeView là renderer duy nhất — C++ vẽ trực tiếp lên GPU */}
          <SkiaKitNativeView
            engineId={engineId}
            style={[styles.canvas, { width: screenWidth, height: screenHeight }, style] as any}
          />
        </RNGestureDetector>
      </WidgetContext.Provider>
    </EngineContext.Provider>
  );
});

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
