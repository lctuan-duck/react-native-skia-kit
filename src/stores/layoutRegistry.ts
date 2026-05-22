import { makeMutable } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// ===== LayoutSharedValues =====
// Each widget has 4 SharedValues representing Yoga-computed coordinates.
// When Yoga finishes calculation, we assign values directly to .value
// -> Skia renders directly on the Native Thread without React re-rendering.

export interface LayoutSharedValues {
  x: SharedValue<number>;
  y: SharedValue<number>;
  width: SharedValue<number>;
  height: SharedValue<number>;
}

// ===== SharedValue Pool =====
// Pre-allocate SharedValues at module load to avoid JNI makeMutable overhead during screen transitions.
const POOL_SIZE = 300;
const _pool: LayoutSharedValues[] = [];

try {
  for (let i = 0; i < POOL_SIZE; i++) {
    _pool.push({
      x: makeMutable(0),
      y: makeMutable(0),
      width: makeMutable(0),
      height: makeMutable(0),
    });
  }
} catch (e) {
  console.warn(
    '[SkiaKit] Failed to pre-allocate SharedValue pool, will fall back to lazy creation.',
    e
  );
}

function createNewLayoutSV(): LayoutSharedValues {
  return {
    x: makeMutable(0),
    y: makeMutable(0),
    width: makeMutable(0),
    height: makeMutable(0),
  };
}

// Internal registry - maps widgetId -> LayoutSharedValues
const _registry = new Map<string, LayoutSharedValues>();

/**
 * Get or create SharedValues for a widget.
 * Pulls from the pre-allocated pool if available.
 */
export function getOrCreateLayoutSV(id: string): LayoutSharedValues {
  let sv = _registry.get(id);
  if (!sv) {
    sv = _pool.pop() || createNewLayoutSV();
    _registry.set(id, sv);
  }
  return sv;
}

/**
 * Batch-update all SharedValues from C++ Yoga layout results.
 * Called from scheduleBatchedLayout.
 */
export function updateLayoutSVs(
  allLayouts: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >
): void {
  for (const id in allLayouts) {
    const sv = _registry.get(id);
    if (sv) {
      const rect = allLayouts[id]!;
      sv.x.value = rect.x;
      sv.y.value = rect.y;
      sv.width.value = rect.width;
      sv.height.value = rect.height;
    }
  }
}

/**
 * Release SharedValues when a widget unmounts.
 * Returns the SharedValues to the pool to prevent memory leaks.
 */
export function releaseLayoutSV(id: string): void {
  const sv = _registry.get(id);
  if (sv) {
    _registry.delete(id);
    // Reset values to 0 before recycling
    sv.x.value = 0;
    sv.y.value = 0;
    sv.width.value = 0;
    sv.height.value = 0;
    _pool.push(sv);
  }
}

/**
 * Snapshot current layout values as plain numbers.
 */
export function snapshotLayout(id: string): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const sv = _registry.get(id);
  if (!sv) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: sv.x.value,
    y: sv.y.value,
    width: sv.width.value,
    height: sv.height.value,
  };
}
