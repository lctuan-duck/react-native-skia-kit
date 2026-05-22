#import "SkiaKitInit.h"
#import <React/RCTBridge+Private.h>

// C++ headers — dùng .mm để Obj-C++ compiler xử lý C++ includes
#include "HybridUIEngine.hpp"

// Shopify RNSkia iOS — RNSkiOSPlatformContext cung cấp FontMgr + image loading
#include "RNSkiOSPlatformContext.h"
#include "RNSkManager.h"

void SkiaKitInitializePlatformContext(void) {
  // Lấy PlatformContext từ RNSkManager singleton (được init bởi Shopify)
  auto& manager = RNSkia::RNSkManager::getInstance();
  auto platformContext = manager.getPlatformContext();

  if (!platformContext) {
    NSLog(@"[SkiaKit] WARNING: RNSkia PlatformContext not available at init time. "
          @"Ensure @shopify/react-native-skia is loaded before SkiaKit.");
    return;
  }

  // Tạo UIEngine instance và inject platformContext
  // NOTE: Trên iOS, HybridObjectRegistry factory sẽ được gọi sau đây bởi Nitro.
  // Cách an toàn nhất: lưu platformContext vào static để factory dùng khi tạo engine.
  margelo::nitro::skiakit::HybridUIEngine::setPendingPlatformContext(platformContext);

  NSLog(@"[SkiaKit] PlatformContext injected successfully.");
}
