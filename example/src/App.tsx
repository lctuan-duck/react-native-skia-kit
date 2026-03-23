import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  CanvasRoot,
  Box,
  Text,
  Nav,
  Screen,
  BottomNavigationBar,
  useNav,
  useNavStore,
} from 'react-native-skia-kit';
import { OrderScreen } from './screens/OrderScreen';
import { HomeScreen } from './screens/HomeScreen';

const TAB_SCREENS = ['home', 'order', 'notifications', 'account'] as const;
const bottomNavItems = [
  { icon: 'home', label: 'Trang chủ' },
  { icon: 'menu', label: 'Order' },
  { icon: 'bell', label: 'Thông báo' },
  { icon: 'user', label: 'Tài khoản' },
];

/**
 * AppContent — separated so useNav can access the navStore context
 * set up by <Nav> parent.
 */
function AppContent() {
  const { width, height } = useWindowDimensions();
  const nav = useNav();
  const bottomNavH = 64;

  // Determine active index from current screen name
  const currentScreen = useNavStore(
    (s) => s.getCurrentScreenName('main') ?? 'home'
  );
  const activeIndex = TAB_SCREENS.indexOf(currentScreen as any);

  const handleTabChange = (index: number) => {
    const screenName = TAB_SCREENS[index];
    if (screenName) {
      nav.switchTo(screenName);
    }
  };

  return (
    <>
      <Nav initial="home" width={width} height={height - bottomNavH}>
        <Screen name="home">
          <HomeScreen width={width} height={height} />
        </Screen>

        <Screen name="order">
          <OrderScreen width={width} height={height} />
        </Screen>

        <Screen name="notifications">
          <Box
            x={0}
            y={0}
            width={width}
            height={height - bottomNavH}
            color="#F5F5F5"
          >
            <Text
              x={width / 2 - 50}
              y={height / 2 - 40}
              text="Thông báo"
              fontSize={20}
              fontWeight="bold"
            />
            <Text
              x={width / 2 - 60}
              y={height / 2 - 10}
              text="Chưa có thông báo"
              fontSize={14}
              color="#9CA3AF"
            />
          </Box>
        </Screen>

        <Screen name="account">
          <Box
            x={0}
            y={0}
            width={width}
            height={height - bottomNavH}
            color="#F5F5F5"
          >
            <Text
              x={width / 2 - 40}
              y={height / 2 - 40}
              text="Tài khoản"
              fontSize={20}
              fontWeight="bold"
            />
            <Text
              x={width / 2 - 80}
              y={height / 2 - 10}
              text="Quản lý tài khoản của bạn"
              fontSize={14}
              color="#9CA3AF"
            />
          </Box>
        </Screen>
      </Nav>

      {/* Bottom Navigation — always visible, uses Nav switchTo */}
      <BottomNavigationBar
        x={0}
        y={height - bottomNavH}
        width={width}
        height={bottomNavH}
        items={bottomNavItems}
        activeIndex={activeIndex >= 0 ? activeIndex : 0}
        activeColor="#16A34A"
        onChange={handleTabChange}
        elevation={8}
      />
    </>
  );
}

export default function App() {
  const { width, height } = useWindowDimensions();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CanvasRoot style={{ width, height }}>
        <AppContent />
      </CanvasRoot>
    </GestureHandlerRootView>
  );
}
