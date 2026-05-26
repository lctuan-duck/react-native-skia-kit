// ===== Color Utilities =====
export {
  resolveSemanticColor,
  resolveOnColor,
  withOpacity,
  contrastColor,
} from './color';

// ===== Gradient Utilities (Phase 3) =====
export {
  linearGradient,
  radialGradient,
  sweepGradient,
  colorPreset,
  toNativeGradient,
} from './gradient';

// ===== Text Utilities =====
export { measureText } from './measureText';

// ===== Type =====
export type { MeasureTextOptions, MeasureTextResult } from './measureText';
