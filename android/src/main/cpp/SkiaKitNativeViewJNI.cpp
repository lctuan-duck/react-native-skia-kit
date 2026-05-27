#include <jni.h>
#include <fbjni/fbjni.h>
#include <android/log.h>

// RNSkia Android canvas provider (OpenGL-backed)
#include "RNSkOpenGLCanvasProvider.h"
#include "RNSkAndroidPlatformContext.h"
#include "JniPlatformContext.h"
#include "JniSkiaManager.h"  // ← để lấy RNSkAndroidPlatformContext từ SkiaManager

// Our engine
#include "HybridUIEngine.hpp"

#define LOG_TAG "SkiaKitNativeView"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

using namespace margelo::nitro::skiakit;

extern "C" {

// ── Platform context init (Android-specific) ─────────────────────────────────

/**
 * nativeInitPlatformContext — nhận SkiaManager (JniSkiaManager) từ Kotlin
 * và lấy RNSkAndroidPlatformContext đã được khởi tạo đúng (với jsCallInvoker).
 *
 * LÝ DO đổi từ PlatformContext sang SkiaManager:
 * - PlatformContext Java → cthis() → JniPlatformContext* → raw pointer
 * - RNSkAndroidPlatformContext(jniCtx, nullptr) tạo context với jsCallInvoker=nullptr
 * - Khi scheduleRender() → runOnMainThread() → CallVoidMethod() → SIGSEGV
 *
 * FIX: JniSkiaManager đã giữ shared_ptr<RNSkAndroidPlatformContext> được init đúng
 * với jsCallInvoker. Lấy trực tiếp từ đó thay vì tạo mới.
 */
JNIEXPORT void JNICALL
Java_com_margelo_nitro_skiakit_SkiaKitNativeView_nativeInitPlatformContext(
    JNIEnv* env,
    jobject /*thiz*/,
    jlong engineId,
    jobject jSkiaManager
) {
    auto engine = HybridUIEngine::findById((int64_t)engineId);
    if (!engine) {
        LOGE("nativeInitPlatformContext: engine not found for id=%lld!", (long long)engineId);
        return;
    }

    if (engine->getPlatformContext()) {
        LOGI("nativeInitPlatformContext: platform context already set, skipping.");
        return;
    }

    // Lấy JniSkiaManager (C++ HybridObject của SkiaManager Java)
    auto jniManagerAlias = jni::alias_ref<RNSkia::JniSkiaManager::javaobject>{
        static_cast<RNSkia::JniSkiaManager::javaobject>(jSkiaManager)
    };
    auto* jniManager = jniManagerAlias->cthis();

    if (!jniManager) {
        LOGE("nativeInitPlatformContext: JniSkiaManager cthis() is null!");
        return;
    }

    // Lấy RNSkAndroidPlatformContext đã được init đúng (có jsCallInvoker)
    auto platformContext = jniManager->getPlatformContext();
    if (!platformContext) {
        LOGE("nativeInitPlatformContext: JniSkiaManager has no platform context!");
        return;
    }

    LOGI("nativeInitPlatformContext: engineId=%lld, ctx=%p", (long long)engineId, platformContext.get());
    engine->initWithPlatformContext(platformContext);
}

// ── Surface lifecycle ─────────────────────────────────────────────────────────

JNIEXPORT void JNICALL
Java_com_margelo_nitro_skiakit_SkiaKitNativeView_nativeOnSurfaceAvailable(
    JNIEnv* env,
    jobject /*thiz*/,
    jlong engineId,
    jobject surfaceTexture,
    jint width,
    jint height
) {
    auto engine = HybridUIEngine::findById((int64_t)engineId);
    if (!engine) {
        LOGE("nativeOnSurfaceAvailable: engine not found for id=%lld!", (long long)engineId);
        return;
    }

    LOGI("nativeOnSurfaceAvailable: engineId=%lld, %dx%d", (long long)engineId, width, height);

    auto platformContext = engine->getPlatformContext();
    if (!platformContext) {
        LOGE("nativeOnSurfaceAvailable: engine has no platform context!");
        return;
    }

    // Tạo OpenGL canvas provider — backed bởi SurfaceTexture (GPU buffer)
    auto provider = std::make_shared<RNSkia::RNSkOpenGLCanvasProvider>(
        []() { /* no-op: SkiaKitRenderer tự schedule */ },
        platformContext
    );

    // SurfaceTexture available → OpenGL context setup
    provider->surfaceAvailable(surfaceTexture, width, height, false /*transparent*/);

    // Attach provider vào engine renderer → C++ bắt đầu tự render
    engine->attachCanvasProvider(provider, (float)width, (float)height);
}

JNIEXPORT void JNICALL
Java_com_margelo_nitro_skiakit_SkiaKitNativeView_nativeOnSurfaceSizeChanged(
    JNIEnv* /*env*/,
    jobject /*thiz*/,
    jlong engineId,
    jobject jSurface,
    jint width,
    jint height
) {
    auto engine = HybridUIEngine::findById((int64_t)engineId);
    if (!engine) return;

    LOGI("nativeOnSurfaceSizeChanged: engineId=%lld, %dx%d", (long long)engineId, width, height);
    engine->resize((double)width, (double)height);
}

JNIEXPORT void JNICALL
Java_com_margelo_nitro_skiakit_SkiaKitNativeView_nativeOnSurfaceDestroyed(
    JNIEnv* /*env*/,
    jobject /*thiz*/,
    jlong engineId
) {
    auto engine = HybridUIEngine::findById((int64_t)engineId);
    if (!engine) return;

    LOGI("nativeOnSurfaceDestroyed: engineId=%lld", (long long)engineId);
    engine->detachNativeView();
}

} // extern "C"
