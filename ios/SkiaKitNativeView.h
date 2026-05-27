#pragma once

#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>

#ifdef __cplusplus
#include "HybridUIEngine.hpp"
#include "RNSkMetalCanvasProvider.h"
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * SkiaKitNativeView — iOS UIView với Metal GPU surface.
 *
 * Cách hoạt động:
 *   1. view được add vào hierarchy → initWithFrame
 *   2. JS gọi registerEngine(ptr) → C++ registers engine pointer
 *   3. Metal canvas provider được tạo và attach vào HybridUIEngine._renderer
 *   4. C++ scheduler tự render trên Main Thread qua CAMetalLayer
 */
@interface SkiaKitNativeView : UIView

/**
 * Attach một HybridUIEngine C++ object vào view này.
 * enginePtr là raw pointer từ NativeHandle của Nitro HybridObject.
 */
- (void)registerEnginePtr:(NSNumber *)enginePtr;

@end

/**
 * SkiaKitNativeViewManager — React Native view manager cho SkiaKitNativeView.
 */
@interface SkiaKitNativeViewManager : RCTViewManager
@end

NS_ASSUME_NONNULL_END
