import * as React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { SkiaPictureView, Skia } from '@shopify/react-native-skia';
import type { SkPicture } from '@shopify/react-native-skia';
import Reconciler from 'react-reconciler';

import { useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import {
  GestureDetector as RNGestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useOverlayStore } from '../stores/overlayStore';
import {
  uiEngine,
  globalActiveWidgetId,
  globalPanEvent,
  globalPanState,
} from './GlobalEngine';
import { WidgetContext } from './WidgetContext';
import { createSkiaKitHostConfig } from './SkiaKitReconciler';
import { updateLayoutSVs } from '../stores/layoutRegistry';

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
 *   → getRootPicture (serialize SkPicture → bytes)
 *   → Skia.Picture.MakePicture(bytes) → setPicture state → SkiaPictureView re-render
 *
 * Canvas Integration (Phase 6E):
 *   Dùng `picture` prop trực tiếp trên SkiaPictureView — KHÔNG dùng SkiaViewApi.setJsiProperty
 *   vì đó là internal unstable API. React state trigger re-render nhẹ (chỉ picture prop thay đổi).
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

  // ── Picture state — React state để trigger SkiaPictureView update
  const [picture, setPicture] = useState<SkPicture | null>(null);

  // Guard: ngăn re-entrant call (resetAfterCommit → setPicture → re-render → lại resetAfterCommit)
  const isRedrawingRef = useRef(false);

  // ── requestRedraw ─────────────────────────────────────────────────────────
  const requestRedraw = useCallback(() => {
    if (isRedrawingRef.current) return; // Chặn re-entrant
    isRedrawingRef.current = true;

    try {
      // 1. Yoga layout → AUTO-BRIDGE vào HitTest + RenderSubsystem (syncLayoutResults)
      uiEngine.calculateLayout(canvasId, screenWidth, screenHeight);

      // 2. Lấy serialized SkPicture bytes từ C++
      const buffer = uiEngine.getRootPicture(canvasId, screenWidth, screenHeight);

      if (__DEV__) {
        const allLayouts = uiEngine.getAllLayouts() ?? {};
        const nodeCount = Object.keys(allLayouts).length;
        console.log('[SkiaKit] picture bytes:', buffer?.byteLength ?? 0, 'nodes:', nodeCount);
        if (nodeCount > 0) {
          // Log layout details
          let c = 0;
          Object.entries(allLayouts).forEach(([id, layout]: [string, any]) => {
            if (c < 10 || id === 'w_eor33mzru' || id === 'w_7ls1odomw' || layout.width > 0) {
                console.log(`  node[${id}]: x=${layout.x?.toFixed(0)} y=${layout.y?.toFixed(0)} w=${layout.width?.toFixed(0)} h=${layout.height?.toFixed(0)}`);
            }
            c++;
          });
        }
      }


      if (buffer && buffer.byteLength > 100) { // > 100 bytes = có content thực sự
        const newPicture = Skia.Picture.MakePicture(new Uint8Array(buffer));
        if (newPicture) {
          // Defer ra ngoài commit phase để tránh sync re-render loop
          // SkiaPictureView.componentDidUpdate sẽ handle redraw
          setPicture(newPicture);
        }
      }

      // 3. Sync layout từ C++ về JS SharedValues để animations đọc được
      const layouts = uiEngine.getAllLayouts();
      if (layouts) {
        updateLayoutSVs(
          layouts as Record<
            string,
            { x: number; y: number; width: number; height: number }
          >
        );
      }
    } finally {
      isRedrawingRef.current = false;
    }
  }, [canvasId, screenWidth, screenHeight]);


  // ── requestRedraw stable ref ────────────────────────────────────────────
  // hostConfig capture requestRedraw một lần duy nhất khi tạo Reconciler.
  // Dùng ref wrapper để luôn gọi version mới nhất (với screenWidth/screenHeight đúng).
  const requestRedrawRef = useRef(requestRedraw);
  requestRedrawRef.current = requestRedraw;

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
    hostConfigRef.current = createSkiaKitHostConfig(stableRequestRedraw);
    reconcilerRef.current = Reconciler(hostConfigRef.current as any);
  }

  const reconciler = reconcilerRef.current!;

  if (!containerRef.current) {
    // 0. Cleanup: xóa debug/stale nodes từ session trước (JS reload giữ nguyên C++ state)
    try {
      uiEngine.removeRenderNode('_dbg_box_');
    } catch { /* node không tồn tại — ignore */ }
    // Cleanup root node cũ nếu có (hot reload)
    try {
      uiEngine.removeRenderNode(canvasId);
    } catch { /* first mount — ignore */ }

    // 1. Tạo Root BoxNode trong C++ (canvasId là root của cây)
    uiEngine.createBoxNode(
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

    // 2. Tạo React Reconciler container
    // ConcurrentRoot = 1: bắt buộc với React 18 Fabric/Concurrent Mode
    containerRef.current = reconciler.createContainer(
      { canvasId }, // containerInfo
      1, // ConcurrentRoot (React 19 Fabric)
      null, // hydrationCallbacks
      false, // isStrictMode
      null, // concurrentUpdatesByDefaultOverride
      '', // identifierPrefix
      (error: unknown) => { console.error('[SkiaKit] onUncaughtError:', error); }, // onUncaughtError
      (error: unknown) => { console.error('[SkiaKit] onCaughtError:', error); },   // onCaughtError
      (error: unknown) => { console.warn('[SkiaKit] onRecoverableError:', error); }, // onRecoverableError
      () => {} // onDefaultTransitionIndicator
    );

    // 3. Validate C++ engine sẵn sàng
    uiEngine.initRenderEngine();
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

    if (__DEV__) {
      console.log('[SkiaKit] updateContainer, children:', children ? 'yes' : 'none');
    }

    // React 19: cần force sync commit cho secondary renderer.
    // Pattern từ React source (scheduleRefresh): updateContainerSync + flushSyncWork
    const rec = reconciler as any;
    const hasSync = typeof rec.updateContainerSync === 'function';
    const hasFlushSync = typeof rec.flushSyncWork === 'function';
    const hasFlushFromRec = typeof rec.flushSyncFromReconciler === 'function';

    if (__DEV__) {
      console.log('[SkiaKit] API check: updateContainerSync=', hasSync,
        'flushSyncWork=', hasFlushSync, 'flushSyncFromReconciler=', hasFlushFromRec);
    }

    if (hasSync && hasFlushFromRec) {
      // Pattern 1: flushSyncFromReconciler wraps updateContainerSync
      // (sets BatchedContext trước để scheduler recognize work)
      rec.flushSyncFromReconciler(() => {
        rec.updateContainerSync(skiaChildren, containerRef.current, null, null);
      });
      if (__DEV__) console.log('[SkiaKit] pattern1 done');
      stableRequestRedraw();
    } else if (hasSync && hasFlushSync) {
      // Pattern 2: updateContainerSync + flushSyncWork (from scheduleRefresh source)
      rec.updateContainerSync(skiaChildren, containerRef.current, null, null);
      rec.flushSyncWork();
      if (__DEV__) console.log('[SkiaKit] pattern2 done');
      stableRequestRedraw();
    } else {
      // Fallback: legacy updateContainer (React 18 / non-concurrent)
      reconciler.updateContainer(
        skiaChildren,
        containerRef.current,
        null as any,
        () => {
          if (__DEV__) {
            console.log('[SkiaKit] updateContainer COMMITTED');
          }
          stableRequestRedraw();
        }
      );
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, reconciler]); // sortedOverlays intentionally via ref

  // Re-run layout khi screen thay đổi
  const requestRedrawRef2 = useRef(requestRedraw);
  requestRedrawRef2.current = requestRedraw;
  React.useEffect(() => {
    if (containerRef.current) {
      // Dùng queueMicrotask để đảm bảo concurrent commit đã xong
      queueMicrotask(() => requestRedrawRef2.current());
    }
  }, [screenWidth, screenHeight]);

  // ── Gesture handling ──────────────────────────────────────────────────────
  const triggerJSCallback = useCallback(
    (
      widgetId: string,
      type: string,
      args: { x?: number; y?: number } & any
    ) => {
      const { getJSCallbacks } = require('./SkiaKitReconciler');
      const cbs = getJSCallbacks(widgetId);
      if (!cbs) return;

      switch (type) {
        case 'press':
          cbs.onPress?.(args.x, args.y);
          break;
        case 'pressIn':
          cbs.onPressIn?.(args.x, args.y);
          break;
        case 'pressOut':
          cbs.onPressOut?.(args.x, args.y);
          break;
        case 'longPress':
          cbs.onLongPress?.();
          break;
        case 'panStart':
          cbs.onPanStart?.(args);
          break;
        case 'panUpdate':
          cbs.onPanUpdate?.(args);
          break;
        case 'panEnd':
          cbs.onPanEnd?.(args);
          break;
      }
    },
    []
  );

  const gesture = Gesture.Simultaneous(
    Gesture.Tap()
      .runOnJS(true)
      .onBegin((e) => {
        const hits = uiEngine.hitTest(e.x, e.y);
        if (__DEV__) {
          console.log(
            `[SkiaKit Tap onBegin] x=${e.x}, y=${e.y}, hits=${hits.length}`
          );
        }
        const hit = hits.length > 0 ? hits[0]! : undefined;
        if (hit?.id) {
          globalActiveWidgetId.value = hit.id;
          triggerJSCallback(hit.id, 'pressIn', {
            x: hit.localX,
            y: hit.localY,
          });
        }
      })
      .onEnd((e) => {
        const hits = uiEngine.hitTest(e.x, e.y);
        if (__DEV__) {
          console.log(
            `[SkiaKit Tap onEnd] x=${e.x}, y=${e.y}, hits=${hits.length}`
          );
        }
        const hit = hits.length > 0 ? hits[0]! : undefined;
        if (hit?.id && hit.id === globalActiveWidgetId.value) {
          triggerJSCallback(hit.id, 'press', {
            x: hit.localX,
            y: hit.localY,
          });
        }
      })
      .onFinalize(() => {
        if (globalActiveWidgetId.value) {
          triggerJSCallback(globalActiveWidgetId.value, 'pressOut', {});
          globalActiveWidgetId.value = '';
        }
      }),

    Gesture.LongPress()
      .runOnJS(true)
      .onStart((e) => {
        const hits = uiEngine.hitTest(e.x, e.y);
        const hit = hits.length > 0 ? hits[0]! : undefined;
        if (hit?.id) {
          triggerJSCallback(hit.id, 'longPress', {});
        }
      }),

    Gesture.Pan()
      .runOnJS(true)
      .onStart((e) => {
        const hits = uiEngine.hitTest(e.x, e.y);
        const hit = hits.length > 0 ? hits[0]! : undefined;
        if (hit?.id) {
          globalActiveWidgetId.value = hit.id;
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
          globalPanEvent.value = ev as any;
          globalPanState.value = 'start';
          triggerJSCallback(hit.id, 'panStart', ev);
        }
      })
      .onUpdate((e) => {
        if (globalActiveWidgetId.value) {
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
          globalPanEvent.value = ev as any;
          globalPanState.value = 'update';
          triggerJSCallback(globalActiveWidgetId.value, 'panUpdate', ev);
        }
      })
      .onEnd((e) => {
        if (globalActiveWidgetId.value) {
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
          globalPanEvent.value = ev as any;
          globalPanState.value = 'end';
          triggerJSCallback(globalActiveWidgetId.value, 'panEnd', ev);
          globalActiveWidgetId.value = '';
        }
      })
      .onFinalize(() => {
        if (globalActiveWidgetId.value) {
          globalActiveWidgetId.value = '';
        }
      })
  );

  return (
    <WidgetContext.Provider value={canvasId}>
      <RNGestureDetector gesture={gesture}>
        {/* picture prop — stable public API của SkiaPictureView */}
        <SkiaPictureView
          picture={picture ?? undefined}

          style={[
            {
              flex: 1,
              width: screenWidth,
              height: screenHeight,
            },
            style,
          ]}
        />
      </RNGestureDetector>
    </WidgetContext.Provider>
  );
});
