#include <jni.h>
#include "skiakitOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::skiakit::initialize(vm);
}
