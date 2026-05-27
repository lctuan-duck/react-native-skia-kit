#import "SkiaKitInit.h"

// SkiaKitInitializePlatformContext đã được deprecated.
//
// iOS FIX: PlatformContext không còn được inject qua singleton RNSkManager::getInstance().
// Thay vào đó, SkiaKitNativeView.mm tự tạo RNSkApplePlatformContext từ RCTBridge
// mỗi khi engine cần — giống pattern của SkiaManager.mm trong RNSkia.
//
// Hàm này được giữ lại để tránh linker errors nếu ai đó đã gọi nó,
// nhưng thực tế là no-op.
void SkiaKitInitializePlatformContext(void) {
  // No-op: PlatformContext creation moved to SkiaKitNativeView._createPlatformContext
  // See: ios/SkiaKitNativeView.mm _setupMetalProviderIfNeeded
}
