import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { useHeroStore } from '../stores/heroStore';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types/widget.types';

// ===== Hero =====

export interface HeroProps extends WidgetProps {
  /** Unique tag to match hero widgets across screens */
  tag: string;
  /** Width of hero bounding box */
  width?: number;
  /** Height of hero bounding box */
  height?: number;
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
 * <Hero tag="product-image" x={16} y={100} width={80} height={80}>
 *   <Image src={product.image} ... />
 * </Hero>
 *
 * // Screen B
 * <Hero tag="product-image" x={0} y={0} width={360} height={300}>
 *   <Image src={product.image} ... />
 * </Hero>
 */
export const Hero = React.memo(function Hero({
  tag,
  x = 0,
  y = 0,
  width,
  height,
  children,
}: HeroProps) {
  const w = width ?? 0;
  const h = height ?? 0;

  useWidget({
    type: 'Hero',
    layout: { x, y, width: w, height: h },
  });

  // Register hero data in store
  useEffect(() => {
    useHeroStore.getState().registerHero(tag, {
      tag,
      rect: { x, y, width: w, height: h },
    });

    return () => {
      useHeroStore.getState().unregisterHero(tag);
    };
  }, [tag, x, y, w, h]);

  const isTransitioning = useHeroStore((s) => s.isTransitioning);

  // Hide during transition (HeroOverlay renders the animated version)
  if (isTransitioning) {
    return null;
  }

  return <Group>{children}</Group>;
});

// ===== HeroOverlay =====

interface HeroTransition {
  tag: string;
  fromRect: { x: number; y: number; width: number; height: number };
  toRect: { x: number; y: number; width: number; height: number };
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

  // When transition starts, compute animation from → to
  useEffect(() => {
    if (isTransitioning) {
      const heroMap = useHeroStore.getState().heroMap;
      const newTransitions: HeroTransition[] = [];

      for (const [tag, hero] of heroMap) {
        const prev = prevHeroesRef.current.get(tag);
        if (prev) {
          newTransitions.push({
            tag,
            fromRect: prev,
            toRect: hero.rect,
          });
        }
      }

      setTransitions(newTransitions);
      progress.value = 0;
      progress.value = withTiming(1, { duration });

      // End transition after animation
      const timer = setTimeout(() => {
        useHeroStore.getState().endTransition();
        setTransitions([]);
      }, duration);

      return () => clearTimeout(timer);
    }

    // Save current positions for next transition
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
  }, [isTransitioning, duration]);

  if (!isTransitioning || transitions.length === 0) return null;

  return (
    <Group>
      {transitions.map((t) => (
        <HeroAnimatedRect
          key={t.tag}
          from={t.fromRect}
          to={t.toRect}
          progress={progress}
        />
      ))}
    </Group>
  );
});

// ===== Internal: Animated rectangle for hero =====

interface HeroAnimatedRectProps {
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number; width: number; height: number };
  progress: { value: number };
}

const HeroAnimatedRect = React.memo(function HeroAnimatedRect({
  from,
  to,
  progress,
}: HeroAnimatedRectProps) {
  const animatedX = useDerivedValue(
    () => from.x + (to.x - from.x) * progress.value
  );
  const animatedY = useDerivedValue(
    () => from.y + (to.y - from.y) * progress.value
  );
  const animatedW = useDerivedValue(
    () => from.width + (to.width - from.width) * progress.value
  );
  const animatedH = useDerivedValue(
    () => from.height + (to.height - from.height) * progress.value
  );

  const transform = useDerivedValue(() => [
    { translateX: animatedX.value },
    { translateY: animatedY.value },
  ]);

  return (
    <Group transform={transform}>
      <Rect
        x={0}
        y={0}
        width={animatedW}
        height={animatedH}
        color="rgba(0,0,0,0.1)"
      />
    </Group>
  );
});
