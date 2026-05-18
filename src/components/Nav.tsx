import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Group } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useNavStore } from '../stores/navStore';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types/widget.types';

export type TransitionType = 'slide' | 'fade' | 'none' | 'custom';

export interface ScreenProps {
  name: string;
  path?: string;
  children?: React.ReactNode;
}

export interface NavProps extends WidgetProps {
  initial: string;
  children: React.ReactNode;
  /** Viewport width */
  width?: number;
  /** Viewport height */
  height?: number;
  /** Transition type for screen changes (default: 'slide') */
  transition?: TransitionType;
  /** Transition duration in ms (default: 300) */
  transitionDuration?: number;
  /** Custom transition renderer (used when transition = 'custom') */
  customTransition?: (props: {
    currentScreen: React.ReactNode;
    prevScreen: React.ReactNode;
    progress: SharedValue<number>;
    width: number;
    height: number;
  }) => React.ReactNode;
  onNavigate?: (screenName: string) => void;
}

export const Nav = React.memo(function Nav({
  width: propWidth,
  height: propHeight,
  children,
  initial,
  transition = 'slide',
  transitionDuration = 300,
  customTransition,
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

  const storeScreenName = getCurrentScreenName('main') ?? initial;

  const [navState, setNavState] = useState<{
    currentScreen: string;
    prevScreen: string | null;
  }>({
    currentScreen: initial,
    prevScreen: null,
  });

  // --- Transition animation values ---
  // progress goes from 0 to 1
  const progress = useSharedValue(1);

  const clearPrevScreen = useCallback(() => {
    setNavState((s) => ({ ...s, prevScreen: null }));
  }, []);

  useEffect(() => {
    setCurrentScreen(initial);
  }, [initial, setCurrentScreen]);

  // When store's active screen changes → trigger transition
  useEffect(() => {
    if (navState.currentScreen !== storeScreenName) {
      setNavState({
        prevScreen: navState.currentScreen,
        currentScreen: storeScreenName,
      });

      if (transition !== 'none') {
        progress.value = 0;
        progress.value = withTiming(
          1,
          {
            duration: transitionDuration,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            if (finished) {
              runOnJS(clearPrevScreen)();
            }
          }
        );
      } else {
        progress.value = 1;
        clearPrevScreen();
      }
    }
  }, [
    storeScreenName,
    navState.currentScreen,
    transition,
    transitionDuration,
    clearPrevScreen,
    progress,
  ]);

  // Extract screens from children
  let currentScreenNode: React.ReactNode = null;
  let prevScreenNode: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const name = (child.props as ScreenProps).name;
      if (name === navState.currentScreen) currentScreenNode = child;
      if (name === navState.prevScreen) prevScreenNode = child;
    }
  });

  // --- Derived Animation Transforms ---

  // Slide: new screen slides in from right (100% to 0)
  const currentSlideTransform = useDerivedValue(() => [
    { translateX: (1 - progress.value) * navWidth },
  ]);
  // Slide: old screen slides out to left (0 to -30%)
  const prevSlideTransform = useDerivedValue(() => [
    { translateX: progress.value * -navWidth * 0.3 },
  ]);

  // Fade: new screen opacity (0 to 1)
  const currentFadeOpacity = useDerivedValue(() => progress.value);
  // Fade: old screen opacity (1 to 0)
  const prevFadeOpacity = useDerivedValue(() => 1 - progress.value);

  // --- Render logic ---

  if (transition === 'custom' && customTransition) {
    return (
      <Group clip={{ x: 0, y: 0, width: navWidth, height: navHeight }}>
        {customTransition({
          currentScreen: currentScreenNode,
          prevScreen: prevScreenNode,
          progress,
          width: navWidth,
          height: navHeight,
        })}
      </Group>
    );
  }

  if (transition === 'slide') {
    return (
      <Group clip={{ x: 0, y: 0, width: navWidth, height: navHeight }}>
        {prevScreenNode && (
          <Group transform={prevSlideTransform}>{prevScreenNode}</Group>
        )}
        <Group transform={currentSlideTransform}>{currentScreenNode}</Group>
      </Group>
    );
  }

  if (transition === 'fade') {
    return (
      <Group clip={{ x: 0, y: 0, width: navWidth, height: navHeight }}>
        {prevScreenNode && (
          <Group opacity={prevFadeOpacity}>{prevScreenNode}</Group>
        )}
        <Group opacity={currentFadeOpacity}>{currentScreenNode}</Group>
      </Group>
    );
  }

  // No transition
  return <Group>{currentScreenNode}</Group>;
});

export const Screen = React.memo(function Screen({ children }: ScreenProps) {
  return <Group>{children}</Group>;
});

(Nav as any).skiaWidgetType = 'Nav';

(Screen as any).skiaWidgetType = 'Screen';
