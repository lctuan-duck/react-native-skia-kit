import { createContext, useContext } from 'react';
import type { UIEngine } from '../nitro/UIEngine.nitro';

/**
 * EngineContextValue — engine + engineId per CanvasRoot.
 *
 * `engineId` là số nguyên unique per HybridUIEngine instance.
 * Worklets dùng `engineId` để lookup đúng engine trong
 * `global.skiaKitEngines[engineId]` (multi-instance safe).
 */
export interface EngineContextValue {
  engine: UIEngine;
  engineId: number;
}

/**
 * EngineContext — cung cấp UIEngine instance cho toàn bộ cây component
 * bên trong một CanvasRoot.
 *
 * Mỗi CanvasRoot tạo 1 UIEngine riêng và cung cấp qua context này.
 * Thay thế hoàn toàn GlobalEngine singleton để hỗ trợ multi-instance.
 *
 * Cách dùng trong component:
 *   const { engine, engineId } = useEngineContext();
 *   engine.updateAnimatedStyles(id, style); // JS thread
 *
 * Trong worklet (UI Thread):
 *   const { engineId } = useEngineContext();
 *   useAnimatedReaction(..., () => {
 *     'worklet';
 *     const boxed = (global as any).skiaKitEngines?.[engineId];
 *     if (boxed) boxed.unbox().updateAnimatedStyles(id, style);
 *   }, [engineId]);
 */
export const EngineContext = createContext<EngineContextValue | null>(null);

/**
 * useEngine — hook để lấy UIEngine của CanvasRoot gần nhất.
 * Throws nếu gọi ngoài CanvasRoot.
 *
 * @returns UIEngine instance (JS thread safe)
 */
export function useEngine(): UIEngine {
  const ctx = useContext(EngineContext);
  if (!ctx) {
    throw new Error(
      '[SkiaKit] useEngine() phải được gọi bên trong <CanvasRoot>. ' +
      'Đảm bảo component được render trong cây của CanvasRoot.'
    );
  }
  return ctx.engine;
}

/**
 * useEngineContext — hook để lấy cả engine + engineId.
 * Dùng khi cần engineId để worklet tìm đúng engine trong multi-instance.
 */
export function useEngineContext(): EngineContextValue {
  const ctx = useContext(EngineContext);
  if (!ctx) {
    throw new Error(
      '[SkiaKit] useEngineContext() phải được gọi bên trong <CanvasRoot>.'
    );
  }
  return ctx;
}
