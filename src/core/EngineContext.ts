import { createContext, useContext } from 'react';
import type { UIEngine } from '../nitro/UIEngine.nitro';

/**
 * EngineContext — cung cấp UIEngine instance cho toàn bộ cây component
 * bên trong một CanvasRoot.
 *
 * Mỗi CanvasRoot tạo 1 UIEngine riêng và cung cấp qua context này.
 * Thay thế hoàn toàn GlobalEngine singleton để hỗ trợ multi-instance.
 *
 * Cách dùng trong component:
 *   const engine = useEngine();
 *   engine.updateAnimatedStyles(id, style);
 */
export const EngineContext = createContext<UIEngine | null>(null);

/**
 * useEngine — hook để lấy UIEngine của CanvasRoot gần nhất.
 * Throws nếu gọi ngoài CanvasRoot.
 */
export function useEngine(): UIEngine {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw new Error(
      '[SkiaKit] useEngine() phải được gọi bên trong <CanvasRoot>. ' +
      'Đảm bảo component được render trong cây của CanvasRoot.'
    );
  }
  return engine;
}
