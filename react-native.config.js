module.exports = {
  dependency: {
    platforms: {
      android: {},
      ios: {},
    },
  },
  // Exclude peer dependencies from being autolinked in the library itself.
  // These will be autolinked in the consuming app (example app) instead.
  dependencies: {
    'react-native-gesture-handler': {
      platforms: {
        android: null,
        ios: null,
      },
    },
    'react-native-reanimated': {
      platforms: {
        android: null,
        ios: null,
      },
    },
    'react-native-worklets': {
      platforms: {
        android: null,
        ios: null,
      },
    },
    '@shopify/react-native-skia': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
