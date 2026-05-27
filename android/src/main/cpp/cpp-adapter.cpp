#include <jni.h>
#include "skiakitOnLoad.hpp"

#include <NitroModules/HybridObjectRegistry.hpp>
#include "HybridUIEngine.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  // Register UIEngine factory
  margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "UIEngine",
    []() -> std::shared_ptr<margelo::nitro::HybridObject> {
      auto engine = std::make_shared<margelo::nitro::skiakit::HybridUIEngine>();

      // Đăng ký vào global engine registry ngay sau make_shared
      // (shared_from_this() an toàn vì make_shared đã hoàn thành)
      // SkiaKitNativeView sẽ tìm engine qua engineId prop thay vì singleton
      engine->registerSelf(engine);

      return engine;
    }
  );

  return margelo::nitro::skiakit::initialize(vm);
}
