project(skiakit)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME skiakit)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# ── react-native-skia paths ──────────────────────────────────────────────────
if(EXISTS "${CMAKE_SOURCE_DIR}/../node_modules/@shopify/react-native-skia")
  set(RNSKIA_DIR "${CMAKE_SOURCE_DIR}/../node_modules/@shopify/react-native-skia")
elseif(EXISTS "${CMAKE_SOURCE_DIR}/../example/node_modules/@shopify/react-native-skia")
  set(RNSKIA_DIR "${CMAKE_SOURCE_DIR}/../example/node_modules/@shopify/react-native-skia")
elseif(EXISTS "${CMAKE_SOURCE_DIR}/../../../node_modules/@shopify/react-native-skia")
  set(RNSKIA_DIR "${CMAKE_SOURCE_DIR}/../../../node_modules/@shopify/react-native-skia")
endif()

message(WARNING "RNSKIA_DIR resolved to: ${RNSKIA_DIR}")

# ── Source files ──────────────────────────────────────────────────────────────
add_library(
  ${PACKAGE_NAME}
  SHARED
  src/main/cpp/cpp-adapter.cpp

  # Existing subsystems
  ../cpp/HybridUIEngine.cpp
  ../cpp/subsystems/HitTestSubsystem.cpp
  ../cpp/subsystems/LayoutSubsystem.cpp
  ../cpp/strategies/QuadTree.cpp

  # Phase 6A: Render core
  ../cpp/core/RenderNode.cpp

  # Phase 1: C++ Autonomous Renderer
  ../cpp/SkiaKitRenderer.cpp

  # Phase 2: Native View JNI bridge (Android surface → C++ renderer)
  src/main/cpp/SkiaKitNativeViewJNI.cpp

  # RNSkia Android canvas provider (OpenGL GPU surface)
  # Header-only: OpenGLContext.h — không cần compile
  ${RNSKIA_DIR}/android/cpp/rnskia-android/RNSkOpenGLCanvasProvider.cpp
  ${RNSKIA_DIR}/android/cpp/rnskia-android/OpenGLWindowContext.cpp
  ${RNSKIA_DIR}/android/cpp/rnskia-android/gl/Error.cpp
  ${RNSKIA_DIR}/android/cpp/rnskia-android/RNSkAndroidVideo.cpp
  ${RNSKIA_DIR}/android/cpp/rnskia-android/AHardwareBufferUtils.cpp
  ${RNSKIA_DIR}/android/cpp/rnskia-android/GrAHardwareBufferUtils.cpp

  # RNSkia JNI platform context (cần bởi RNSkAndroidPlatformContext)
  # Các symbols này không nằm trong static .a — cần compile riêng
  ${RNSKIA_DIR}/android/cpp/jni/JniPlatformContext.cpp
  ${RNSKIA_DIR}/android/cpp/jni/JniSkiaManager.cpp
)

# ── Nitrogen generated bindings ───────────────────────────────────────────────
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/skiakit+autolinking.cmake)

# ── Include directories ───────────────────────────────────────────────────────
include_directories(
  # Project headers
  "src/main/cpp"
  "../cpp"
  "../cpp/core"
  "../cpp/subsystems"
  "../cpp/strategies"
  "../nitrogen/generated/shared/c++"

  # Shopify react-native-skia headers (Skia + skparagraph + JSI canvas API)
  "${RNSKIA_DIR}/cpp"
  "${RNSKIA_DIR}/cpp/api"
  "${RNSKIA_DIR}/cpp/rnskia"
  "${RNSKIA_DIR}/cpp/jsi"
  "${RNSKIA_DIR}/cpp/utils"
  "${RNSKIA_DIR}/android/cpp/rnskia-android"
  "${RNSKIA_DIR}/android/cpp/jni/include"
  "${RNSKIA_DIR}/cpp/skia"
  "${RNSKIA_DIR}/cpp/skia/modules/skparagraph/include"
  "${RNSKIA_DIR}/cpp/skia/modules/skparagraph/include"
)

# ── Link libraries ────────────────────────────────────────────────────────────
find_library(LOG_LIB log)

# Link against Skia static libraries provided by Shopify
set(SKIA_LIBS_DIR "${RNSKIA_DIR}/libs/android/${ANDROID_ABI}")

add_library(skia STATIC IMPORTED)
set_target_properties(skia PROPERTIES IMPORTED_LOCATION "${SKIA_LIBS_DIR}/libskia.a")

add_library(skparagraph STATIC IMPORTED)
set_target_properties(skparagraph PROPERTIES IMPORTED_LOCATION "${SKIA_LIBS_DIR}/libskparagraph.a")

add_library(skshaper STATIC IMPORTED)
set_target_properties(skshaper PROPERTIES IMPORTED_LOCATION "${SKIA_LIBS_DIR}/libskshaper.a")

add_library(skunicode_core STATIC IMPORTED)
set_target_properties(skunicode_core PROPERTIES IMPORTED_LOCATION "${SKIA_LIBS_DIR}/libskunicode_core.a")

add_library(skunicode_icu STATIC IMPORTED)
set_target_properties(skunicode_icu PROPERTIES IMPORTED_LOCATION "${SKIA_LIBS_DIR}/libskunicode_icu.a")

target_link_libraries(
  ${PACKAGE_NAME}
  ${LOG_LIB}
  android
  jnigraphics
  # OpenGL ES + EGL — cần cho RNSkOpenGLCanvasProvider
  EGL
  GLESv2
  skparagraph
  skshaper
  skunicode_core
  skunicode_icu
  skia
)
