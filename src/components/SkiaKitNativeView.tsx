/**
 * SkiaKitNativeView — React Native wrapper cho native GPU canvas view.
 *
 * Phase 3: Multi-instance support.
 * Mỗi SkiaKitNativeView nhận `engineId` từ CanvasRoot (= uiEngine.getEngineId()).
 * Native view dùng engineId để lookup đúng HybridUIEngine từ global registry
 * thay vì singleton sFactoryEngine cũ.
 *
 * Cách dùng (trong CanvasRoot.tsx):
 *   const engineId = useMemo(() => uiEngine.getEngineId(), []);
 *   <SkiaKitNativeView engineId={engineId} style={{ flex: 1 }} />
 */
import { requireNativeComponent, ViewStyle } from 'react-native';
import type { HostComponent } from 'react-native';

interface SkiaKitNativeViewProps {
  style?: ViewStyle;
  /**
   * engineId — unique ID của HybridUIEngine instance tương ứng với CanvasRoot này.
   * Lấy từ: uiEngine.getEngineId()
   * Native view dùng ID này để tìm đúng engine từ global registry (multi-instance safe).
   */
  engineId: number;
}

const SkiaKitNativeView: HostComponent<SkiaKitNativeViewProps> =
  requireNativeComponent('SkiaKitNativeView');

export default SkiaKitNativeView;
