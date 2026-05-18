import { NitroModules } from 'react-native-nitro-modules';
import type { UIEngine } from '../nitro/UIEngine.nitro';
import { makeMutable } from 'react-native-reanimated';
import type { PanEvent } from '../types/widget.types';

// Create the C++ UIEngine instance
export const uiEngine = NitroModules.createHybridObject<UIEngine>('UIEngine');

// Global event bus for Reanimated worklets
export const globalActiveWidgetId = makeMutable<string | null>(null);
export const globalPanEvent = makeMutable<PanEvent | null>(null);
export const globalPanState = makeMutable<'start' | 'update' | 'end' | null>(
  null
);
