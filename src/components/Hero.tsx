import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSharedValue, withTiming, useDerivedValue } from 'react-native-reanimated';
import { useHeroStore } from '../stores/heroStore';
import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import { useSkiaAnimatedStyle } from '../hooks/useSkiaAnimatedStyle';
import type { NativeAnimatedStyle } from '../nitro/UIEngine.nitro';

// ===== Hero =====

export interface HeroProps extends WidgetProps {
  /** Unique tag to match hero widgets across screens */
  tag: string;
  /** Width of hero bounding box */
  width?: number | string;
  /** Height of hero bounding box */
  height?: number | string;
  children: React.ReactNode;
}

/**
 * Hero — shared element transition.
 * Wraps a child and registers it with heroStore.
 * When screen transitions occur, HeroOverlay animates
 * the widget from source position to destination position.
 *
 * Equivalent to Flutter Hero widget.
 *
 * @example
 * // Screen A
 * <Hero tag="product-image" width={80} height={80}>
 *   <Image src={product.image} ... />
 * </Hero>
 *
 * // Screen B
 * <Hero tag="product-image" width={360} height={300}>
 *   <Image src={product.image} ... />
 * </Hero>
 */
export const Hero = React.memo(function Hero({
  tag,
  width,
  height,
  children,
}: HeroProps) {
  const isTransitioning = useHeroStore((s) => s.isTransitioning);

  if (__DEV__) {
    console.log(
      `[Hero] ${tag} rendering with size ${width}x${height}, isTransitioning: ${isTransitioning}`
    );
  }
  return (
    <Box
      style={{
        width,
        height,
        overflow: 'hidden',
        opacity: isTransitioning ? 0 : 1,
      }}
      onLayout={(layout) => {
        useHeroStore.getState().registerHero(tag, {
          tag,
          rect: layout,
          children,
        });
      }}
    >
      {children}
    </Box>
  );
});

// ===== HeroOverlay =====

interface HeroTransition {
  tag: string;
  fromRect: { x: number; y: number; width: number; height: number };
  toRect: { x: number; y: number; width: number; height: number };
  children?: React.ReactNode;
}

export interface HeroOverlayProps {
  /** Transition duration in ms */
  duration?: number;
}

/**
 * HeroOverlay — renders animated hero transitions on top of everything.
 * Place this AFTER CanvasRoot in the component tree.
 *
 * When navStore screen changes, HeroOverlay:
 * 1. Snapshots all current Hero positions (fromRect)
 * 2. After new screen renders, reads new Hero positions (toRect)
 * 3. Animates lerp from fromRect → toRect
 *
 * @example
 * <CanvasRoot>...</CanvasRoot>
 * <HeroOverlay />
 */
export const HeroOverlay = React.memo(function HeroOverlay({
  duration = 300,
}: HeroOverlayProps) {
  const isTransitioning = useHeroStore((s) => s.isTransitioning);
  const [transitions, setTransitions] = useState<HeroTransition[]>([]);
  const prevHeroesRef = useRef<
    Map<string, { x: number; y: number; width: number; height: number }>
  >(new Map());
  const progress = useSharedValue(0);

  // When transition starts, snapshot fromRects immediately, then defer
  // reading toRects by one rAF tick so the new screen's Heroes have had
  // a chance to call registerHero() before we build the transition list.
  useEffect(() => {
    if (isTransitioning) {
      // Step 1: capture current positions as "from" before new screen renders
      const fromSnapshot = new Map<
        string,
        { x: number; y: number; width: number; height: number }
      >();
      for (const [tag, rect] of prevHeroesRef.current) {
        fromSnapshot.set(tag, rect);
      }

      // Step 2: wait one frame for the new screen's Hero components to mount
      // and call registerHero(), then build the animation list.
      const frameId = requestAnimationFrame(() => {
        const heroMap = useHeroStore.getState().heroMap;
        const newTransitions: HeroTransition[] = [];

        for (const [tag, hero] of heroMap) {
          const prev = fromSnapshot.get(tag);
          if (prev) {
            newTransitions.push({
              tag,
              fromRect: prev,
              toRect: hero.rect,
              children: hero.children,
            });
          }
        }

        setTransitions(newTransitions);
        progress.value = 0;
        progress.value = withTiming(1, { duration });
      });

      // End transition after animation
      const timer = setTimeout(() => {
        useHeroStore.getState().endTransition();
        setTransitions([]);
      }, duration + 16); // +16ms to account for the rAF delay above

      return () => {
        cancelAnimationFrame(frameId);
        clearTimeout(timer);
      };
    }

    // Save current positions for next transition (only when not transitioning)
    const heroMap = useHeroStore.getState().heroMap;
    const snapshot = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();

    for (const [tag, hero] of heroMap) {
      snapshot.set(tag, { ...hero.rect });
    }
    prevHeroesRef.current = snapshot;
    return undefined;
  }, [isTransitioning, duration, progress]);

  if (!isTransitioning || transitions.length === 0) return null;

  return (
    <Box
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      {transitions.map((t) => (
        <HeroAnimatedRect
          key={t.tag}
          from={t.fromRect}
          to={t.toRect}
          progress={progress}
        >
          {t.children}
        </HeroAnimatedRect>
      ))}
    </Box>
  );
});

// ===== Internal: Animated rectangle for hero =====

interface HeroAnimatedRectProps {
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number; width: number; height: number };
  progress: any;
  children?: React.ReactNode;
}

const HeroAnimatedRect = React.memo(function HeroAnimatedRect({
  from,
  to,
  progress,
  children,
}: HeroAnimatedRectProps) {
  const animatedId = React.useId();

  const animatedStyle = useDerivedValue<NativeAnimatedStyle>(() => {
    const t = progress.value;
    return {
      left: from.x + (to.x - from.x) * t,
      top: from.y + (to.y - from.y) * t,
      width: from.width + (to.width - from.width) * t,
      height: from.height + (to.height - from.height) * t,
    };
  });

  useSkiaAnimatedStyle(animatedId, animatedStyle);

  return (
    <Box
      id={animatedId}
      style={{
        position: 'absolute',
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
});

(Hero as any).skiaWidgetType = 'Hero';

(HeroOverlay as any).skiaWidgetType = 'HeroOverlay';
(HeroAnimatedRect as any).skiaWidgetType = 'HeroAnimatedRect';
