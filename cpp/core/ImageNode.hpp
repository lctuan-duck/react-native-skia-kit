#pragma once

#include "RenderNode.hpp"
#include <mutex>
#include <atomic>
#include <functional>
#include <string>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include <include/core/SkCanvas.h>
#include <include/core/SkImage.h>
#include <include/core/SkPaint.h>
#include <include/core/SkRect.h>
#include <include/core/SkData.h>
#include <RNSkPlatformContext.h>
#include <include/core/SkSamplingOptions.h>
#pragma clang diagnostic pop

// Forward declare để không kéo toàn bộ RNSkia headers vào đây
namespace RNSkia { class RNSkPlatformContext; }

namespace margelo::nitro::skiakit {

/**
 * ImageNode — Async image loader + drawable.
 *
 * loadAsync() dùng RNSkPlatformContext::performStreamOperation() — chạy trên background thread.
 * Sau khi load xong, gọi onRequestRedraw (inject từ RenderSubsystem) để trigger canvas repaint.
 *
 * Thread safety:
 *   - _image được bảo vệ bởi _imageMutex (background write / render read)
 *   - loading flag dùng std::atomic<bool>
 */
class ImageNode : public RenderNode {
public:
  explicit ImageNode(const std::string& id, const std::string& uri)
    : RenderNode(id, "Image"), _uri(uri) {}

  /**
   * Bắt đầu load ảnh async từ URI.
   * redrawCallback được gọi trên background thread sau khi ảnh sẵn sàng.
   */
  void loadAsync(
    std::shared_ptr<RNSkia::RNSkPlatformContext> context,
    std::function<void()> redrawCallback)
  {
    if (_loading.exchange(true)) return;  // Đang load → bỏ qua

    context->performStreamOperation(_uri,
      [this, redrawCallback = std::move(redrawCallback)]
      (std::unique_ptr<SkStreamAsset> stream) mutable {
        if (!stream) {
          _loading.store(false);
          return;
        }

        // Đọc toàn bộ data từ stream vào SkData
        sk_sp<SkData> data = SkData::MakeFromStream(stream.get(), stream->getLength());

        if (data) {
          sk_sp<SkImage> img;
          // SkImage::MakeFromEncoded — API tương thích với Skia bundled trong RN Skia
#if SK_VERSION_MAJOR >= 87
          img = SkImages::DeferredFromEncodedData(std::move(data));
#else
          img = SkImages::DeferredFromEncodedData(std::move(data));
#endif
          {
            std::lock_guard<std::mutex> lock(_imageMutex);
            _image = std::move(img);
          }
        }

        _loading.store(false);

        // Trigger canvas redraw — image đã sẵn sàng
        if (redrawCallback) redrawCallback();
      }
    );
  }

  void draw(SkCanvas* canvas) override {
    sk_sp<SkImage> img;
    {
      std::lock_guard<std::mutex> lock(_imageMutex);
      img = _image;
    }
    if (!img) return;  // Đang load hoặc load lỗi

    float w, h;
    {
      std::shared_lock<std::shared_mutex> lock(_childrenMutex);
      w = getWidth();
      h = getHeight();
    }
    if (w <= 0.f || h <= 0.f) return;

    const SkRect dst = SkRect::MakeWH(w, h);
    SkPaint paint;
    paint.setAntiAlias(true);
    canvas->drawImageRect(
      img, dst,
      SkSamplingOptions(SkFilterMode::kLinear),
      &paint
    );
  }

private:
  const std::string  _uri;
  sk_sp<SkImage>     _image;        // guarded by _imageMutex
  std::mutex         _imageMutex;
  std::atomic<bool>  _loading{false};
};

} // namespace margelo::nitro::skiakit
