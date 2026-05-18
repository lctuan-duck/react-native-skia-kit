import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  CanvasRoot,
  Nav,
  Screen,
  HeroOverlay,
  useTheme,
  enableThemePersistence,
} from 'react-native-skia-kit';

import { HomeScreen } from './screens/HomeScreen';
import { CardDetailScreen } from './screens/CardDetailScreen';

enableThemePersistence();

function RootApp() {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
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

export default function App() {
  return <RootApp />;
}
