#include <jni.h>
#include "skiakitOnLoad.hpp"

#include <NitroModules/HybridObjectRegistry.hpp>
#include "HybridUIEngine.hpp"



JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  // 2. Register UIEngine factory
  margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "UIEngine",
    []() -> std::shared_ptr<margelo::nitro::HybridObject> {
      auto engine = std::make_shared<margelo::nitro::skiakit::HybridUIEngine>();
      // We'll initialize platform context later or via JS if needed
      return engine;
    }
  );

  return margelo::nitro::skiakit::initialize(vm);
}

