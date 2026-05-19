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
import { useHeroStore } from '../stores/heroStore';
import { useWidget } from '../hooks/useWidget';
import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import { WidgetContext } from '../core/WidgetContext';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';

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
  const storeScreenName = useNavStore((s) => s.getCurrentScreenName('main')) ?? initial;
  const setCurrentScreen = useNavStore((s) => s.setCurrentScreen);

  const widgetId = useWidget({
    type: 'Nav',
    layout: { x: 0, y: 0, width: navWidth, height: navHeight },
  });

  // Register Nav as a real Yoga node so Screen children
  // are positioned relative to Nav, not the root.
  useNativeYogaLayout(widgetId, {
    width: navWidth,
    height: navHeight,
    flexDirection: 'column',
  });

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
        useHeroStore.getState().startTransition();
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
      <WidgetContext.Provider value={widgetId}>
        <Group clip={{ x: 0, y: 0, width: navWidth, height: navHeight }}>
          {customTransition({
            currentScreen: currentScreenNode,
            prevScreen: prevScreenNode,
            progress,
            width: navWidth,
            height: navHeight,
          })}
        </Group>
      </WidgetContext.Provider>
    );
  }

  if (transition === 'slide') {
    return (
      <WidgetContext.Provider value={widgetId}>
        <Group clip={{ x: 0, y: 0, width: navWidth, height: navHeight }}>
          {prevScreenNode && (
            <Group transform={prevSlideTransform}>{prevScreenNode}</Group>
          )}
          <Group transform={currentSlideTransform}>{currentScreenNode}</Group>
        </Group>
      </WidgetContext.Provider>
    );
  }

  if (transition === 'fade') {
    return (
      <WidgetContext.Provider value={widgetId}>
        <Group clip={{ x: 0, y: 0, width: navWidth, height: navHeight }}>
          {prevScreenNode && (
            <Group opacity={prevFadeOpacity}>{prevScreenNode}</Group>
          )}
          <Group opacity={currentFadeOpacity}>{currentScreenNode}</Group>
        </Group>
      </WidgetContext.Provider>
    );
  }

  // No transition
  return (
    <WidgetContext.Provider value={widgetId}>
      <Group>{currentScreenNode}</Group>
    </WidgetContext.Provider>
  );
});

export const Screen = React.memo(function Screen({ name, children }: ScreenProps) {
  return (
    <Box
      id={`screen-${name}`}
      style={{
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      {children}
    </Box>
  );
});

(Nav as any).skiaWidgetType = 'Nav';

(Screen as any).skiaWidgetType = 'Screen';
