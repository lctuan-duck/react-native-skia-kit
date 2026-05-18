import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  CanvasRoot,
  Nav,
  Screen,
  HeroOverlay,
  useThemeStore,
} from 'react-native-skia-kit';

import { HomeScreen } from './screens/HomeScreen';
import { CardDetailScreen } from './screens/CardDetailScreen';

export default function App() {
  const { width, height } = useWindowDimensions();

  // Set up Dark Theme and Neon colors
  useEffect(() => {
    const store = useThemeStore.getState();
    const darkTheme = store.themeMap.get('dark');
    if (darkTheme) {
      store.registerTheme('dark', {
        ...darkTheme, // inherit base dark theme
        colors: {
          ...darkTheme.colors,
          background: '#0A0A0A',
          surface: '#1A1A1A',
          primary: '#00E5FF',    // Cyan Neon
          secondary: '#B000FF',  // Purple Neon
          textBody: '#FFFFFF',
          textSecondary: '#A0A0A0',
        },
      });
      store.setActiveTheme('dark');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <CanvasRoot style={{ width, height }}>
        <Nav
          initial="Home"
          width={width}
          height={height}
          transition="fade" // Use fade transition while Hero animates
          transitionDuration={400}
        >
          <Screen name="Home">
            <HomeScreen />
          </Screen>
          <Screen name="CardDetail">
            <CardDetailScreen />
          </Screen>
        </Nav>
        {/* Render Hero transitions on top of everything */}
        <HeroOverlay duration={400} />
      </CanvasRoot>
    </GestureHandlerRootView>
  );
}
