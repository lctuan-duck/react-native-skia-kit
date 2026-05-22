import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNativeOverlayStore } from '../stores/nativeOverlayStore';

interface NativeOverlayProviderProps {
  children: React.ReactNode;
}

/**
 * NativeOverlayProvider
 * Must wrap CanvasRoot. This provides a React Native container layered perfectly
 * over the Skia Canvas to mount real Native Views (e.g. TextInput) at absolute positions.
 */
export const NativeOverlayProvider = ({ children }: NativeOverlayProviderProps) => {
  const overlaysMap = useNativeOverlayStore((s) => s.overlays);
  const overlays = Array.from(overlaysMap.values()).sort((a, b) => a.zIndex - b.zIndex);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {children}
      {/* Mount standard React Native elements on top of the Canvas */}
      {overlays.map((overlay) => (
        <React.Fragment key={overlay.id}>{overlay.node}</React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
