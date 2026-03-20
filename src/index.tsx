import { NitroModules } from 'react-native-nitro-modules';
import type { SkiaKit } from './SkiaKit.nitro';

const SkiaKitHybridObject =
  NitroModules.createHybridObject<SkiaKit>('SkiaKit');

export function multiply(a: number, b: number): number {
  return SkiaKitHybridObject.multiply(a, b);
}
