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

  // Lưu platformContext vào static để factory (constructor) dùng khi tạo engine (iOS pattern)
  // Phase 3: Engine tự đăng ký vào _sRegistry trong registerSelf() sau make_shared
  // → không cần postInitCallback hay skiakit_setFactoryEngineiOS nữa
  margelo::nitro::skiakit::HybridUIEngine::setPendingPlatformContext(platformContext);

  NSLog(@"[SkiaKit] PlatformContext set. Engine will register in global registry on creation.");
}
