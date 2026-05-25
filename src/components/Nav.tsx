import * as React from 'react';
import { useState, useEffect } from 'react';

import { useWindowDimensions } from 'react-native';
import { useNavStore } from '../stores/navStore';
import { useWidgetId } from '../hooks/useWidgetId';
import { Box } from './Box';
import type { WidgetProps } from '../types/widget.types';
import { WidgetContext } from '../core/WidgetContext';
import type { SharedValue } from 'react-native-reanimated';

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

/**
 * Nav — screen navigation container (SkiaKit Reconciler-safe version).
 *
 * QUAN TRỌNG: Component này chạy trong SkiaKit secondary Reconciler.
 * - KHÔNG dùng Shopify Skia components (Group, etc.)
 * - KHÔNG dùng Reanimated hooks (useSharedValue trong secondary renderer có thể crash)
 * - Chỉ dùng: useState, useEffect, useCallback, useRef, useContext + SkiaKit host elements
 *
 * Transition animation sẽ được implement ở level C++ khi rendering hoạt động.
 */
export const Nav = React.memo(function Nav({
  width: propWidth,
  height: propHeight,
  children,
  initial,
}: NavProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navWidth = propWidth ?? screenWidth;
  const navHeight = propHeight ?? screenHeight;

  const widgetId = useWidgetId('Nav');

  // Current screen state
  const [currentScreen, setCurrentScreen] = useState(initial);

  // Sync với navStore khi store thay đổi
  const storeScreenName =
    useNavStore((s) => s.getCurrentScreenName('main')) ?? initial;
  const storeSetCurrentScreen = useNavStore((s) => s.setCurrentScreen);

  useEffect(() => {
    storeSetCurrentScreen(initial);
  }, [initial, storeSetCurrentScreen]);

  // Khi store change → update local state
  useEffect(() => {
    if (storeScreenName !== currentScreen) {
      setCurrentScreen(storeScreenName);
    }
  }, [storeScreenName, currentScreen]);

  // Extract screen node từ children
  let currentScreenNode: React.ReactNode = null;
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const name = (child.props as ScreenProps).name;
      if (name === currentScreen) {
        currentScreenNode = child;
      }
    }
  });

  if (__DEV__) {
    console.log(
      '[Nav] rendering screen:',
      currentScreen,
      'has node:',
      !!currentScreenNode
    );
  }

  // Nav container dùng Box (SkiaKit host element) thay vì Group (Shopify Skia)
  return (
    <WidgetContext.Provider value={widgetId}>
      <Box
        id={widgetId}
        style={{
          width: navWidth,
          height: navHeight,
          overflow: 'hidden',
          flexDirection: 'column',
        }}
      >
        {currentScreenNode}
      </Box>
    </WidgetContext.Provider>
  );
});

export const Screen = React.memo(function Screen({
  name,
  children,
}: ScreenProps) {
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
