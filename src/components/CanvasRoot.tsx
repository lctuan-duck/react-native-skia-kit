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


interface CanvasRootProps {
  style?: ViewStyle;
  canvasId?: string;
  children?: React.ReactNode;
}

/**
 * CanvasRoot v2 — Root canvas với C++ Render Tree.
 *
 * Flow per commit:
 *   JSX tree → SkiaKitReconciler → C++ createBoxNode/createTextNode/...
 *   → resetAfterCommit → markDirty + requestRedraw()
 *   → calculateLayout (AUTO-BRIDGE Layout→HitTest→Render)
 *
 * Canvas Integration:
 *   Dùng SkiaKitNativeView (Nitro) để render trực tiếp C++ Surface.
 */
export const CanvasRoot = React.memo(function CanvasRoot({
  style,
  canvasId = 'main',
  children,
}: CanvasRootProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const overlaysMap = useOverlayStore((s) => s.overlays);
  const overlays = Array.from(overlaysMap.values());
  const sortedOverlays = [...overlays].sort((a, b) => a.zIndex - b.zIndex);

  // Phase 4: per-instance engine — mỗi CanvasRoot tạo 1 UIEngine riêng
  // Thay thế GlobalEngine singleton. Engine bị destroy khi CanvasRoot unmount.
  const engine = useMemo<UIEngine>(
    () => NitroModules.createHybridObject<UIEngine>('UIEngine'),
    [] // tạo 1 lần khi mount
  );

  // Phase 3: engineId cho SkiaKitNativeView multi-instance lookup
  const engineId = useMemo(() => engine.getEngineId(), [engine]);

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
    // JS thread globals
    (global as any).skiaKitRequestRedraw = () => {
      engine.scheduleLayoutAndRender();
    };
    (global as any).skiaKitScrollRedraw = () => {
      // no-op: C++ tự handle sau setScrollPosition
    };

    // Phase 3: C++ push layout results đến JS sau mỗi layout cycle
    // C++ gọi callback này trên JS thread → JS getAllLayouts + updateLayoutSVs
    // → useNativeYogaLayout components (ScrollView, TabBar...) nhận đúng layout
    engine.onLayoutComplete(() => {
      const layouts = engine.getAllLayouts();
      if (layouts) {
        updateLayoutSVs(
          layouts as Record<string, { x: number; y: number; width: number; height: number }>
        );
      }
    });

    // Worklet thread globals
    const boxedEngine = NitroModules.box(engine);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runOnUI((boxed: any) => {
      'worklet';
      (global as any).updateAnimatedStylesDirect = (
        id: string,
        style: Record<string, unknown>
      ) => {
        'worklet';
        const eng = boxed.unbox();
        if (eng && id) {
          eng.updateAnimatedStyles(id, style as any);
        }
      };
      (global as any).skiaKitScrollRedraw = () => {
        'worklet';
        // no-op: setScrollPosition đã trigger scheduleRender() trong C++
      };
    })(boxedEngine);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    const skiaChildren = (
      <>
        {children}
        {sortedOverlaysRef.current.map((o) => (
          <React.Fragment key={o.id}>{o.node}</React.Fragment>
        ))}
      </>
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
  }, [children, reconciler]); // sortedOverlays intentionally via ref

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

  // Cleanup: detach native view khi unmount
  React.useEffect(() => {
    return () => {
      engine.detachNativeView();
    };
  }, [engine]);

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

  const gesture = Gesture.Simultaneous(
    Gesture.Tap()
      .runOnJS(true)
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
      }),

    Gesture.LongPress()
      .runOnJS(true)
      .onStart((e) => {
        const hits = engine.hitTest(e.x, e.y);
        for (let i = hits.length - 1; i >= 0; i--) {
          const hit = hits[i]!;
          const handled = triggerJSCallback(hit.id, 'longPress', {});
          if (handled) break;
        }
      }),

    Gesture.Pan()
      .runOnJS(true)
      .onStart((e) => {
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
        if (globalActivePanIdRef.current) {
          globalActivePanIdRef.current = '';
        }
      })
  );

  return (
    <EngineContext.Provider value={engine}>
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
