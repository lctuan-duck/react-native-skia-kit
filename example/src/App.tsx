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

import { ComponentShowcaseScreen } from './screens/ComponentShowcaseScreen';
import { ShaderTestScreen } from './screens/ShaderTestScreen';

enableThemePersistence();

function RootApp() {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <CanvasRoot style={{ width, height }}>
        <Nav
          initial="Showcase"
          width={width}
          height={height}
          transition="slide"
          transitionDuration={300}
        >
          <Screen name="Showcase">
            <ComponentShowcaseScreen />
          </Screen>
          <Screen name="ShaderTest">
            <ShaderTestScreen />
          </Screen>
        </Nav>
        {/* Hero transitions rendered on top of all screens */}
        <HeroOverlay duration={400} />
      </CanvasRoot>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return <RootApp />;
}
