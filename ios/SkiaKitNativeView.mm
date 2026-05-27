#import "SkiaKitNativeView.h"

// React Native bridge headers
#import <React/RCTBridge+Private.h>

// C++ Obj-C++ compilation
#include "HybridUIEngine.hpp"
#include "RNSkMetalCanvasProvider.h"
#include "RNSkApplePlatformContext.h"
#include <NitroModules/HybridObjectRegistry.hpp>

using namespace margelo::nitro::skiakit;

// ── UIEngine Factory Registration ─────────────────────────────────────────────
// Dùng ObjC +load để đăng ký UIEngine constructor với NitroModules registry.
@interface SkiaKitUIEngineAutolinking : NSObject
@end

@implementation SkiaKitUIEngineAutolinking

+ (void)load {
  using namespace margelo::nitro;
  HybridObjectRegistry::registerHybridObjectConstructor(
    "UIEngine",
    []() -> std::shared_ptr<HybridObject> {
      auto engine = std::make_shared<HybridUIEngine>();
      engine->registerSelf(engine);
      return engine;
    }
  );
}

@end


@implementation SkiaKitNativeView {
    RNSkMetalCanvasProvider* _canvasProvider;
    int64_t _engineId;
}

@synthesize bridge = _bridge;

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        self.backgroundColor = [UIColor clearColor];
        self.opaque = NO;
        _engineId = -1;
    }
    return self;
}

/**
 * setEngineId — nhận engineId từ JS CanvasRoot qua RCT_EXPORT_VIEW_PROPERTY.
 */
- (void)setEngineId:(NSNumber *)engineId {
    _engineId = engineId.longLongValue;
    NSLog(@"[SkiaKitNativeView] setEngineId: %lld", _engineId);
    if (self.window) {
        [self _setupMetalProviderIfNeeded];
    }
}

- (void)didMoveToWindow {
    [super didMoveToWindow];
    if (self.window && _engineId >= 0) {
        [self _setupMetalProviderIfNeeded];
    }
}

- (void)_setupMetalProviderIfNeeded {
    if (_canvasProvider) return;
    if (_engineId < 0) {
        NSLog(@"[SkiaKitNativeView] _setupMetalProvider: engineId not yet set, waiting...");
        return;
    }

    auto engine = HybridUIEngine::findById(_engineId);
    if (!engine) {
        NSLog(@"[SkiaKitNativeView] _setupMetalProvider: engine not found for id=%lld!", _engineId);
        return;
    }

    // iOS FIX: Tạo PlatformContext từ bridge (được set bởi ViewManager khi tạo view).
    // KHÔNG dùng RNSkManager::getInstance() — đây là legacy singleton không còn tồn tại.
    // RNSkApplePlatformContext(bridge, jsInvoker) là cùng pattern SkiaManager.mm dùng.
    if (!engine->getPlatformContext()) {
        auto platformContext = [self _createPlatformContext];
        if (platformContext) {
            engine->initWithPlatformContext(platformContext);
            NSLog(@"[SkiaKitNativeView] PlatformContext injected for engineId=%lld", _engineId);
        } else {
            NSLog(@"[SkiaKitNativeView] ERROR: Could not create PlatformContext! Bridge=%@", _bridge);
            return;
        }
    }

    auto platformContext = engine->getPlatformContext();
    if (!platformContext) {
        NSLog(@"[SkiaKitNativeView] _setupMetalProvider: engine still has no platform context!");
        return;
    }

    _canvasProvider = new RNSkMetalCanvasProvider(
        []() { /* no-op: C++ renderer tự schedule */ },
        platformContext
    );

    CAMetalLayer* metalLayer = (__bridge CAMetalLayer*)_canvasProvider->getLayer();
    if (metalLayer) {
        metalLayer.frame = self.bounds;
        metalLayer.contentsScale = [UIScreen mainScreen].scale;
        [self.layer addSublayer:metalLayer];
        NSLog(@"[SkiaKitNativeView] Metal layer attached: %.0fx%.0f (engineId=%lld)",
              self.bounds.size.width, self.bounds.size.height, _engineId);
    }

    float w = (float)(self.bounds.size.width * [UIScreen mainScreen].scale);
    float h = (float)(self.bounds.size.height * [UIScreen mainScreen].scale);
    if (w > 0 && h > 0) {
        _canvasProvider->setSize((int)w, (int)h);
    }

    engine->attachCanvasProvider(
        std::shared_ptr<RNSkia::RNSkCanvasProvider>(
            std::shared_ptr<SkiaKitNativeView>((__bridge void*)self, [](void*){}),
            _canvasProvider
        ),
        w, h
    );

    NSLog(@"[SkiaKitNativeView] Provider attached to engine %lld: %.0fx%.0f", _engineId, w, h);
}

/**
 * _createPlatformContext — tạo RNSkApplePlatformContext từ bridge.
 *
 * Bridge được truyền từ SkiaKitNativeViewManager (self.bridge trong -view).
 * Pattern giống SkiaManager.mm của RNSkia:
 *   new RNSkApplePlatformContext(bridge, cxxBridge.jsCallInvoker)
 */
- (std::shared_ptr<RNSkia::RNSkPlatformContext>)_createPlatformContext {
    RCTBridge *bridge = _bridge;
    if (!bridge) {
        // Fallback: RCTBridge.currentBridge (hoạt động trong cả Bridge và New Arch mode)
        bridge = [RCTBridge currentBridge];
    }

    if (!bridge) {
        NSLog(@"[SkiaKitNativeView] ERROR: No RCTBridge available for PlatformContext creation");
        return nullptr;
    }

    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker = cxxBridge.jsCallInvoker;
    if (!jsInvoker) {
        NSLog(@"[SkiaKitNativeView] ERROR: jsCallInvoker is nil (bridge=%@)", bridge);
        return nullptr;
    }

    return std::make_shared<RNSkia::RNSkApplePlatformContext>(bridge, jsInvoker);
}

- (void)layoutSubviews {
    [super layoutSubviews];

    if (!_canvasProvider) {
        [self _setupMetalProviderIfNeeded];
        return;
    }

    CALayer* metalLayer = _canvasProvider->getLayer();
    if (metalLayer) {
        metalLayer.frame = self.bounds;
    }

    float w = (float)(self.bounds.size.width * [UIScreen mainScreen].scale);
    float h = (float)(self.bounds.size.height * [UIScreen mainScreen].scale);
    if (w > 0 && h > 0) {
        _canvasProvider->setSize((int)w, (int)h);
        if (_engineId >= 0) {
            auto engine = HybridUIEngine::findById(_engineId);
            if (engine) {
                engine->resize((double)w, (double)h);
            }
        }
    }
}

- (void)dealloc {
    if (_engineId >= 0 && _canvasProvider) {
        auto engine = HybridUIEngine::findById(_engineId);
        if (engine) {
            engine->detachNativeView();
        }
    }
    if (_canvasProvider) {
        delete _canvasProvider;
        _canvasProvider = nullptr;
    }
}

@end

// ── ViewManager ────────────────────────────────────────────────────────────────

@implementation SkiaKitNativeViewManager

RCT_EXPORT_MODULE(SkiaKitNativeView)

/**
 * -view: tạo SkiaKitNativeView và inject bridge ngay khi tạo.
 * Bridge từ self.bridge (RCTViewManager) luôn available — cả Bridge lẫn New Arch mode.
 * View cần bridge để tạo RNSkApplePlatformContext mà không qua RNSkManager singleton.
 */
- (UIView *)view {
    SkiaKitNativeView *view = [[SkiaKitNativeView alloc] initWithFrame:CGRectZero];
    view.bridge = self.bridge;
    return view;
}

RCT_EXPORT_VIEW_PROPERTY(engineId, NSNumber)

@end
