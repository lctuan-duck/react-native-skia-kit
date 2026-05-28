import * as React from 'react';
import type { WidgetProps } from '../types/widget.types';
import type { FlexChildStyle, SpacingStyle } from '../types/style.types';

import { useScrollPhysics } from '../hooks/useScrollPhysics';
import { useEngine } from '../core/EngineContext';
import { useWidgetId } from '../hooks/useWidgetId';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { Box } from './Box';

export type ScrollViewStyle = FlexChildStyle &
  SpacingStyle & {
    width?: number | string;
    height?: number | string;
    gap?: number;
  };

export interface ScrollViewProps extends WidgetProps {
  children: React.ReactNode;
  horizontal?: boolean;
  physics?: 'clamping' | 'bouncing';
  contentSize?: number;
  scrollEnabled?: boolean;
  onScroll?: (offset: number) => void;
  /**
   * Maximum overscroll distance in pixels (bouncing mode only).
   * When the user drags past the top/bottom boundary, the content can
   * rubber-band by at most this many pixels before springing back.
   * @default 60
   */
  maxOverscroll?: number;
  /** Style override */
  style?: ScrollViewStyle;
}

export const ScrollView = React.forwardRef<any, ScrollViewProps>(
  (props, ref) => {
    const id = useWidgetId('scroll');
    const engine = useEngine();
    const contentBoxId = useWidgetId('scroll-content');
    const horizontal = props.horizontal ?? false;

    const viewportLayout = useNativeYogaLayout(id);
    const contentLayout = useNativeYogaLayout(contentBoxId);

    const viewportSize = props.horizontal
      ? viewportLayout.width || 800
      : viewportLayout.height || 800;

    const contentSize =
      props.contentSize ??
      (props.horizontal
        ? contentLayout.width || 2000
        : contentLayout.height || 2000);



    const physics = useScrollPhysics(props.physics ?? 'bouncing', {
      viewportSize,
      contentSize,
    });

    // ── Source of truth for scroll offset ────────────────────────────────────
    // IMPORTANT: Do NOT read physics.scrollOffset.value (Reanimated SharedValue) during drag.
    // On New Arch (Fabric), SharedValue writes from JS thread are async — they go to the UI
    // thread, so reading .value immediately after writing it may return the old value.
    // Use currentOffsetRef (plain useRef) as the authoritative drag offset.
    const currentOffsetRef = React.useRef(0);

    // Flag: true during finger-down drag, false during decay/spring animation.
    const isDraggingRef = React.useRef(false);

    const updateNative = React.useCallback(
      (val: number) => {
        if (id) {
          engine.setScrollPosition(id, val);
          (global as any).skiaKitScrollRedraw?.();
        }
      },
      [id, engine]
    );

    // RAF loop
    const isScrollingRef = React.useRef(false);
    const rafIdRef = React.useRef<number>(0);
    const stopTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    );
    const rafFrameRef = React.useRef(0);

    const startScrollLoop = React.useCallback(() => {
      if (stopTimeoutRef.current !== null) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      rafFrameRef.current = 0;

      const tick = () => {
        // During drag: read from plain ref (always correct, no Reanimated sync issues).
        // During decay/spring: read from Reanimated SharedValue (animated by withDecay/withSpring).
        const val = isDraggingRef.current
          ? currentOffsetRef.current
          : physics.scrollOffset.value;

        // CRITICAL: keep currentOffsetRef in sync during decay/spring so that the NEXT
        // gesture's startOffsetRef reflects the actual visual position, not the stale
        // drag-end position. Without this, gesture 2 starts from wrong offset → jump.
        if (!isDraggingRef.current) {
          currentOffsetRef.current = val;
        }

        rafFrameRef.current++;
        updateNative(val);
        if (isScrollingRef.current) {
          rafIdRef.current = requestAnimationFrame(tick);
        }
      };
      rafIdRef.current = requestAnimationFrame(tick);
    }, [physics.scrollOffset, updateNative]);

    const stopScrollLoop = React.useCallback(() => {
      isScrollingRef.current = false;
      isDraggingRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    }, []);

    React.useEffect(
      () => () => {
        stopScrollLoop();
        if (stopTimeoutRef.current !== null)
          clearTimeout(stopTimeoutRef.current);
      },
      [stopScrollLoop]
    );

    // startOffsetRef: plain ref for drag start position — avoids Reanimated sync issues.
    const startOffsetRef = React.useRef(0);

    // Tracks the delta (total finger translation) AT THE MOMENT the finger crossed
    // the scroll boundary into overscroll territory. Used to compute excess as
    // "how far the finger has moved SINCE crossing the boundary" — giving true 1:1
    // movement at the boundary and progressive slowdown toward maxOverscroll.
    // Reset to null whenever we return inside bounds.
    const overscrollEntryDeltaRef = React.useRef<number | null>(null);

    const onPanStart = React.useCallback(() => {
      // Freeze Reanimated animation (if any decay was running)
      physics.handlePanStart();
      // Use currentOffsetRef — the authoritative JS-thread offset.
      // physics.scrollOffset.value might be stale due to Fabric async sync.
      startOffsetRef.current = currentOffsetRef.current;
      overscrollEntryDeltaRef.current = null; // Reset on each new gesture
      isDraggingRef.current = true;
      startScrollLoop();
    }, [physics, startScrollLoop, id, viewportSize, contentSize]);

    const onPanUpdate = React.useCallback(
      (e: any) => {
        const delta = horizontal ? e.translationX : e.translationY;
        const newVal = startOffsetRef.current - delta;
        const currentMaxScroll = Math.max(0, contentSize - viewportSize);

        let clampedVal: number;
        const isBouncing = (props.physics ?? 'bouncing') === 'bouncing';
        const maxOverscroll = props.maxOverscroll ?? 80;

        if (isBouncing && newVal < 0) {
          // Entered overscroll past top boundary.
          // Record the delta AT WHICH the finger crossed 0 (only once per overscroll entry).
          if (overscrollEntryDeltaRef.current === null) {
            // The exact delta when content hit 0: delta = startOffset + 0 = startOffset
            overscrollEntryDeltaRef.current = startOffsetRef.current;
          }
          // excess = how far the FINGER has moved SINCE crossing the boundary.
          // This starts at 0 right when crossing → 1:1 feel at the boundary.
          const excess = Math.abs(delta - overscrollEntryDeltaRef.current);
          // tanh: starts 1:1 then asymptotically slows to 0 as excess → ∞.
          // Hard cap at maxOverscroll.
          clampedVal = -(maxOverscroll * Math.tanh(excess / maxOverscroll));
        } else if (isBouncing && newVal > currentMaxScroll) {
          // Entered overscroll past bottom boundary.
          if (overscrollEntryDeltaRef.current === null) {
            // Exact delta when content hit maxScroll: delta = startOffset - maxScroll
            overscrollEntryDeltaRef.current =
              startOffsetRef.current - currentMaxScroll;
          }
          const excess = Math.abs(delta - overscrollEntryDeltaRef.current);
          clampedVal =
            currentMaxScroll +
            maxOverscroll * Math.tanh(excess / maxOverscroll);
        } else {
          // Back in bounds — reset entry point for next overscroll
          overscrollEntryDeltaRef.current = null;
          clampedVal = newVal;
        }

        currentOffsetRef.current = clampedVal;
        physics.scrollOffset.value = clampedVal;
      },
      [
        horizontal,
        physics,
        contentSize,
        viewportSize,
        props.physics,
        props.maxOverscroll,
      ]
    );

    const onPanEnd = React.useCallback(
      (e: any) => {
        const velocity = horizontal ? e.velocityX : e.velocityY;
        // Switch to decay mode — RAF will now read from Reanimated SharedValue
        isDraggingRef.current = false;
        physics.scrollOffset.value = currentOffsetRef.current;
        physics.handlePanEnd(velocity);
        stopTimeoutRef.current = setTimeout(() => {
          stopTimeoutRef.current = null;
          currentOffsetRef.current = physics.scrollOffset.value;
          stopScrollLoop();
        }, 800);
      },
      [horizontal, physics, stopScrollLoop]
    );

    return React.createElement(
      'Scroll',
      {
        ...props,
        id,
        ref,
        onPanStart,
        onPanUpdate,
        onPanEnd,
      },
        <Box
          id={contentBoxId}
          style={{
            flexDirection: horizontal ? 'row' : 'column',
            // Children của vertical ScrollView phải fill full width theo viewport.
            // alignItems:'stretch' = Yoga sẽ set cross-size của mỗi child bằng parent width.
            // Nếu không có flag này, children co theo content (wrap) → ListTile, Column bị hẹp.
            // Horizontal ScrollView không cần stretch height vì scroll theo chiều ngang.
            alignItems: horizontal ? 'start' : 'stretch',
          }}
        >
        {props.children}
      </Box>
    );
  }
);

(ScrollView as any).skiaWidgetType = 'ScrollView';

export interface GridViewProps extends ScrollViewProps {
  crossAxisCount?: number;
  mainAxisSpacing?: number;
  crossAxisSpacing?: number;
  childAspectRatio?: number;
}

export const GridView = React.forwardRef<any, GridViewProps>((props, ref) => {
  return React.createElement('Scroll', { ...props, ref }, props.children);
});

(GridView as any).skiaWidgetType = 'GridView';

export interface PageViewProps extends ScrollViewProps {
  initialPage?: number;
  onPageChanged?: (page: number) => void;
}

export const PageView = React.forwardRef<any, PageViewProps>((props, ref) => {
  return React.createElement('Scroll', { ...props, ref }, props.children);
});

(PageView as any).skiaWidgetType = 'PageView';
