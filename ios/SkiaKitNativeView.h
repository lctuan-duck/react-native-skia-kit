#pragma once

#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>
#import <React/RCTBridge.h>

#ifdef __cplusplus
#include "HybridUIEngine.hpp"
#include "RNSkMetalCanvasProvider.h"
#include "RNSkApplePlatformContext.h"
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * SkiaKitNativeView — iOS UIView với Metal GPU surface.
 *
 * Flow:
 *   1. SkiaKitNativeViewManager tạo view và gán bridge (self.bridge)
 *   2. JS CanvasRoot set engineId prop → setEngineId() được gọi
 *   3. didMoveToWindow → _setupMetalProviderIfNeeded
 *   4. PlatformContext được tạo từ bridge (không qua RNSkManager singleton)
 *   5. RNSkMetalCanvasProvider tạo và attach vào HybridUIEngine._renderer
 *   6. C++ scheduler tự render qua CAMetalLayer
 */
@interface SkiaKitNativeView : UIView

/** Bridge được set từ SkiaKitNativeViewManager khi tạo view */
@property (nonatomic, weak, nullable) RCTBridge *bridge;

/** engineId — set từ JS qua RCT_EXPORT_VIEW_PROPERTY */
- (void)setEngineId:(NSNumber *)engineId;

@end

/**
 * SkiaKitNativeViewManager — React Native view manager cho SkiaKitNativeView.
 */
@interface SkiaKitNativeViewManager : RCTViewManager
@end

NS_ASSUME_NONNULL_END
