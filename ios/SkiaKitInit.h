#pragma once

#ifdef __OBJC__
#import <Foundation/Foundation.h>

// iOS: Inject RNSkPlatformContext vào HybridUIEngine tại module init time.
// Được gọi từ SkiaKitInit.mm khi RCTBridge/TurboModule initializes SkiaKit.
//
// Lý do: RNSkPlatformContext là C++ object — không thể truyền từ JS qua JSI.
// Phải inject tại native init time, trước khi JS gọi bất kỳ API nào.
void SkiaKitInitializePlatformContext(void);

#endif // __OBJC__
