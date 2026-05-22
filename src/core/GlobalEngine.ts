import { NitroModules } from 'react-native-nitro-modules';
import type { UIEngine } from '../nitro/UIEngine.nitro';
// Create the C++ UIEngine instance
export const uiEngine = NitroModules.createHybridObject<UIEngine>('UIEngine');

// Global event bus for Reanimated worklets
// (Moved to CanvasRoot.tsx directly to avoid cross-module SharedValue issues)
