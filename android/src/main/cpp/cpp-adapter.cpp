#include <jni.h>
#include "skiakitOnLoad.hpp"

#include <NitroModules/HybridObjectRegistry.hpp>
#include "HybridUIEngine.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "UIEngine",
    []() -> std::shared_ptr<margelo::nitro::HybridObject> {
      return std::make_shared<margelo::nitro::skiakit::HybridUIEngine>();
    }
  );
  return margelo::nitro::skiakit::initialize(vm);
}
