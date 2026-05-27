#import "SkiaKitNativeView.h"

// C++ Obj-C++ compilation
#include "HybridUIEngine.hpp"
#include "RNSkMetalCanvasProvider.h"
#include "RNSkiOSPlatformContext.h"
#include "RNSkManager.h"
#include <NitroModules/HybridObjectRegistry.hpp>

using namespace margelo::nitro::skiakit;

// ── UIEngine Factory Registration (iOS equivalent of cpp-adapter.cpp) ─────────
// Dùng ObjC +load để đăng ký UIEngine constructor với NitroModules registry.
// Tương đương JNI_OnLoad → registerHybridObjectConstructor("UIEngine") trên Android.
@interface SkiaKitUIEngineAutolinking : NSObject
@end

@implementation SkiaKitUIEngineAutolinking

+ (void)load {
  using namespace margelo::nitro;
  HybridObjectRegistry::registerHybridObjectConstructor(
    "UIEngine",
    []() -> std::shared_ptr<HybridObject> {
      auto engine = std::make_shared<HybridUIEngine>();
      // Đăng ký vào global registry ngay sau make_shared
      // (shared_from_this() an toàn vì make_shared đã hoàn thành)
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

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        self.backgroundColor = [UIColor clearColor];
        self.opaque = NO;
        _engineId = -1; // Chưa nhận engineId từ JS
    }
    return self;
}

/**
 * setEngineId — nhận engineId từ JS CanvasRoot qua RCT_EXPORT_VIEW_PROPERTY.
 * Gọi _setupMetalProviderIfNeeded nếu view đã attach vào window.
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
    if (_canvasProvider) return; // đã setup
    if (_engineId < 0) {
        NSLog(@"[SkiaKitNativeView] _setupMetalProvider: engineId not yet set, waiting...");
        return;
    }

    auto engine = HybridUIEngine::findById(_engineId);
    if (!engine) {
        NSLog(@"[SkiaKitNativeView] _setupMetalProvider: engine not found for id=%lld!", _engineId);
        return;
    }

    auto platformContext = engine->getPlatformContext();
    if (!platformContext) {
        NSLog(@"[SkiaKitNativeView] _setupMetalProvider: engine has no platform context!");
        return;
    }

    // Tạo Metal-backed canvas provider với CAMetalLayer
    _canvasProvider = new RNSkMetalCanvasProvider(
        []() { /* no-op: C++ renderer tự schedule */ },
        platformContext
    );

    // Lấy CAMetalLayer và embed vào UIView
    CAMetalLayer* metalLayer = (__bridge CAMetalLayer*)_canvasProvider->getLayer();
    if (metalLayer) {
        metalLayer.frame = self.bounds;
        metalLayer.contentsScale = [UIScreen mainScreen].scale;
        [self.layer addSublayer:metalLayer];
        NSLog(@"[SkiaKitNativeView] Metal layer attached: %.0fx%.0f (engineId=%lld)",
              self.bounds.size.width, self.bounds.size.height, _engineId);
    }

    // Set kích thước ban đầu
    float w = (float)(self.bounds.size.width * [UIScreen mainScreen].scale);
    float h = (float)(self.bounds.size.height * [UIScreen mainScreen].scale);
    if (w > 0 && h > 0) {
        _canvasProvider->setSize((int)w, (int)h);
    }

    // Attach provider vào engine renderer → C++ bắt đầu tự render
    engine->attachCanvasProvider(
        std::shared_ptr<RNSkia::RNSkCanvasProvider>(
            std::shared_ptr<SkiaKitNativeView>((__bridge void*)self, [](void*){}),
            _canvasProvider
        ),
        w, h
    );

    NSLog(@"[SkiaKitNativeView] Provider attached to engine %lld: %.0fx%.0f", _engineId, w, h);
}

- (void)layoutSubviews {
    [super layoutSubviews];

    if (!_canvasProvider) {
        [self _setupMetalProviderIfNeeded];
        return;
    }

    // Resize Metal layer và notify engine
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

- (UIView *)view {
    return [[SkiaKitNativeView alloc] initWithFrame:CGRectZero];
}

/**
 * engineId — nhận unique engine ID từ JS CanvasRoot.
 * JS: uiEngine.getEngineId() → <SkiaKitNativeView engineId={id} />
 */
RCT_EXPORT_VIEW_PROPERTY(engineId, NSNumber)

@end
