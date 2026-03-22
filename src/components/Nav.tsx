import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Group } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useNavStore } from '../stores/navStore';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../core/types';

export type TransitionType = 'slide' | 'fade' | 'none';

export interface ScreenProps {
  name: string;
  path?: string;
  children?: React.ReactNode;
}

export interface NavProps extends WidgetProps {
  initial: string;
  children: React.ReactNode;
  /** Transition type for screen changes (default: 'slide') */
  transition?: TransitionType;
  /** Transition duration in ms (default: 300) */
  transitionDuration?: number;
  onNavigate?: (screenName: string) => void;
}

/**
 * Nav — navigation container with transition animations.
 * Auto-registers child Screens by name and renders current screen.
 *
 * Tương đương Flutter Navigator / Router.
 *
 * Supports:
 * - 'slide': Slide-in from right (push), slide-out to right (pop)
 * - 'fade': Cross-fade between screens
 * - 'none': Instant switch
 */
export const Nav = React.memo(function Nav({
  width: propWidth,
  height: propHeight,
  children,
  initial,
  transition = 'slide',
  transitionDuration = 300,
  onNavigate: _onNavigate,
}: NavProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navWidth = propWidth ?? screenWidth;
  const navHeight = propHeight ?? screenHeight;
  const getCurrentScreenName = useNavStore((s) => s.getCurrentScreenName);
  const setCurrentScreen = useNavStore((s) => s.setCurrentScreen);

  useWidget({
    type: 'Nav',
    layout: { x: 0, y: 0, width: navWidth, height: navHeight },
  });

  const currentScreenName = getCurrentScreenName('main') ?? initial;
  const prevScreenNameRef = useRef<string>(currentScreenName);

  // --- Transition animation values ---
  const slideProgress = useSharedValue(0);
  const fadeOpacity = useSharedValue(1);

  // Track previous screen for outgoing animation

  useEffect(() => {
    setCurrentScreen(initial);
  }, [initial, setCurrentScreen]);

  // When screen changes → trigger transition
  useEffect(() => {
    if (prevScreenNameRef.current !== currentScreenName) {
      if (transition === 'slide') {
        slideProgress.value = navWidth; // start off-screen
        slideProgress.value = withTiming(0, {
          duration: transitionDuration,
          easing: Easing.out(Easing.cubic),
        });
      } else if (transition === 'fade') {
        fadeOpacity.value = 0;
        fadeOpacity.value = withTiming(1, {
          duration: transitionDuration,
          easing: Easing.inOut(Easing.ease),
        });
      }
      prevScreenNameRef.current = currentScreenName;
    }
  }, [currentScreenName, transition, transitionDuration, navWidth]);

  // Derived transforms for Skia Group
  const slideTransform = useDerivedValue(() => [
    { translateX: slideProgress.value },
  ]);

  const fadeTransform = useDerivedValue(() => fadeOpacity.value);

  // Find the screen component for current name
  let currentScreen: React.ReactNode = null;
  React.Children.forEach(children, (child) => {
    if (
      React.isValidElement(child) &&
      (child.props as ScreenProps).name === currentScreenName
    ) {
      currentScreen = child;
    }
  });

  // Render based on transition type — wrapped in clip to prevent overflow
  if (transition === 'slide') {
    return (
      <Group clip={{ x: 0, y: 0, width: navWidth, height: navHeight }}>
        <Group transform={slideTransform}>{currentScreen}</Group>
      </Group>
    );
  }

  if (transition === 'fade') {
    return (
      <Group clip={{ x: 0, y: 0, width: navWidth, height: navHeight }}>
        <Group opacity={fadeTransform}>{currentScreen}</Group>
      </Group>
    );
  }

  // No transition
  return <Group>{currentScreen}</Group>;
});

/**
 * Screen — wrapper for a named screen within Nav.
 * Just renders children; name is consumed by Nav.
 */
export const Screen = React.memo(function Screen({ children }: ScreenProps) {
  return <Group>{children}</Group>;
});
