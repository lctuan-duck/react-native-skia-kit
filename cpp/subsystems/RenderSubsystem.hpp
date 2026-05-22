#pragma once

#include "../core/RenderNode.hpp"
#include "../core/BoxNode.hpp"
#include "../core/TextNode.hpp"
#include "../core/ImageNode.hpp"
#include "../core/ScrollNode.hpp"
#include "../core/IconNode.hpp"

#include <string>
#include <unordered_map>
#include <memory>
#include <shared_mutex>
#include <mutex>
#include <atomic>
#include <vector>
#include <functional>
#include <cstdint>

#ifdef __ANDROID__
#include <android/log.h>
#define SKIAKIT_LOG(...) __android_log_print(ANDROID_LOG_DEBUG, "SkiaKit", __VA_ARGS__)
#else
#define SKIAKIT_LOG(...)
#endif

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"
#include <include/core/SkCanvas.h>
#include <include/core/SkPicture.h>
#include <include/core/SkPictureRecorder.h>
#include <include/core/SkBBHFactory.h>
#include <include/core/SkData.h>
#include <include/core/SkFontMgr.h>
#include <modules/skparagraph/include/FontCollection.h>
#pragma clang diagnostic pop

namespace RNSkia { class RNSkPlatformContext; }

namespace margelo::nitro::skiakit {

struct CachedLayout {
  float x = 0.f, y = 0.f, width = 0.f, height = 0.f;
};

/**
 * RenderSubsystem — Quản lý toàn bộ Render Tree.
 *
 * Threading:
 *   - _nodesMutex (shared_mutex): writers = JS/Reconciler, readers = drawTree
 *   - _pictureMutex (mutex): writer = rebuildPicture, reader = drawTree/getPictureBytes
 *   - _isDirty (atomic<bool>): lock-free dirty flag
 *
 * Canvas Integration (Phase 6E):
 *   getPictureBytes() serialize SkPicture → bytes → JS reconstruct via Skia.Picture.MakePicture.
 *   Đây là bridge an toàn, không cần JSI runtime access trực tiếp.
 *   Overhead chỉ xảy ra khi dirty (không phải mỗi frame).
 */
class RenderSubsystem {
public:
  // ── Initialization ────────────────────────────────────────────────────────

  void initFontManager(sk_sp<SkFontMgr> fontMgr) {
    _fontCollection = sk_make_sp<skia::textlayout::FontCollection>();
    _fontCollection->setDefaultFontManager(std::move(fontMgr));
    _fontCollection->enableFontFallback();
  }

  void setRedrawCallback(std::function<void()> cb) {
    _redrawCallback = std::move(cb);
  }

  // ── Node lifecycle (JS/Reconciler thread) ─────────────────────────────────

  void createBoxNode(const std::string& id, const BoxProps& props) {
    auto node = std::make_shared<BoxNode>(id);
    node->updateProps(props);
    node->onRequestRedraw = _redrawCallback;
    insertNode(id, std::move(node));
  }

  void createTextNode(const std::string& id, const TextProps& props) {
    auto node = std::make_shared<TextNode>(id);
    if (_fontCollection) node->setFontCollection(_fontCollection);
    node->updateProps(props);
    node->onRequestRedraw = _redrawCallback;
    insertNode(id, std::move(node));
  }

  void createImageNode(const std::string& id, const std::string& uri) {
    auto node = std::make_shared<ImageNode>(id, uri);
    node->onRequestRedraw = _redrawCallback;
    insertNode(id, std::move(node));
  }

  void createScrollNode(const std::string& id, bool horizontal) {
    auto node = std::make_shared<ScrollNode>(id, horizontal);
    node->onRequestRedraw = _redrawCallback;
    insertNode(id, std::move(node));
  }

  void createIconNode(const std::string& id, const std::string& pathStr, uint32_t color, bool isStroke, float strokeWidth) {
    auto node = std::make_shared<IconNode>(id);
    node->updateIcon(pathStr, static_cast<SkColor>(color), isStroke, strokeWidth);
    node->onRequestRedraw = _redrawCallback;
    {
      std::unique_lock<std::shared_mutex> lock(_nodesMutex);
      _nodes[id] = node;
    }
    markDirty();
  }

  void updateBoxNode(const std::string& id, const BoxProps& props) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it != _nodes.end()) {
      if (auto* box = dynamic_cast<BoxNode*>(it->second.get())) {
        box->updateProps(props);
        _isDirty.store(true);
      }
    }
  }

  void updateTextNode(const std::string& id, const TextProps& props) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it != _nodes.end()) {
      if (auto* text = dynamic_cast<TextNode*>(it->second.get())) {
        text->updateProps(props);
        _isDirty.store(true);
      }
    }
  }

  void updateIconNode(const std::string& id, const std::string& pathStr, uint32_t color, bool isStroke, float strokeWidth) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it != _nodes.end()) {
      if (auto* icon = dynamic_cast<IconNode*>(it->second.get())) {
        icon->updateIcon(pathStr, static_cast<SkColor>(color), isStroke, strokeWidth);
        markDirty();
      }
    }
  }

  void startImageLoad(const std::string& id, std::shared_ptr<RNSkia::RNSkPlatformContext> ctx) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it != _nodes.end()) {
      if (auto* img = dynamic_cast<ImageNode*>(it->second.get())) {
        img->loadAsync(ctx, _redrawCallback);
      }
    }
  }

  void addRenderChild(const std::string& parentId, const std::string& childId) {
    std::unique_lock<std::shared_mutex> lock(_nodesMutex);
    auto pit = _nodes.find(parentId);
    auto cit = _nodes.find(childId);
    if (pit == _nodes.end() || cit == _nodes.end()) {
      SKIAKIT_LOG("addRenderChild FAILED: parent=%s(%s) child=%s(%s)",
        parentId.c_str(), pit == _nodes.end() ? "NOT FOUND" : "OK",
        childId.c_str(), cit == _nodes.end() ? "NOT FOUND" : "OK");
      return;
    }
    pit->second->addChild(cit->second);
    SKIAKIT_LOG("addRenderChild OK: parent=%s now has %zu children",
      parentId.c_str(), pit->second->children.size());
    _isDirty.store(true);
  }

  void removeRenderChild(const std::string& parentId, const std::string& childId) {
    std::unique_lock<std::shared_mutex> lock(_nodesMutex);
    auto pit = _nodes.find(parentId);
    auto cit = _nodes.find(childId);
    if (pit == _nodes.end() || cit == _nodes.end()) return;
    pit->second->removeChild(cit->second);
    _isDirty.store(true);
  }

  /** Xóa node + toàn bộ descendant (recursive) — không leak orphaned nodes. */
  void removeRenderNode(const std::string& id) {
    std::unique_lock<std::shared_mutex> lock(_nodesMutex);
    removeRenderNodeRecursive(id);
    _isDirty.store(true);
  }

  // ── Layout sync ───────────────────────────────────────────────────────────

  void syncLayoutResults(const std::unordered_map<std::string, CachedLayout>& layouts) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    for (auto& [id, layout] : layouts) {
      auto it = _nodes.find(id);
      if (it != _nodes.end()) {
        it->second->setCachedLayout(layout.x, layout.y, layout.width, layout.height);
      }
    }
    _isDirty.store(true);
  }

  // ── Scroll ────────────────────────────────────────────────────────────────

  void updateScrollNodeOffset(const std::string& id, float offset) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it != _nodes.end()) {
      if (auto* scroll = dynamic_cast<ScrollNode*>(it->second.get())) {
        scroll->setScrollOffset(offset);
        // CRITICAL: mark dirty so the next getPictureBytes/drawTree call rebuilds
        // the render tree with the new scroll offset. Without this, getPictureBytes
        // returns the cached picture (with old offset) and scroll is invisible.
        _isDirty.store(true);
        // _redrawCallback here would trigger a full JS-side requestRedraw,
        // which is too expensive for scroll. Skip it — JS scrollRedraw path
        // calls getPictureBytes directly after this.
      }
    }
  }

  void updateRenderNodeStyle(const std::string& id, float opacity) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it != _nodes.end()) {
      it->second->setOpacity(opacity);
      if (_redrawCallback) _redrawCallback();
    }
  }

  // ── Dirty flag ────────────────────────────────────────────────────────────

  void markDirty() { _isDirty.store(true); }

  bool isDirty() const { return _isDirty.load(); }

  // ── Draw (nội bộ — gọi trực tiếp với SkCanvas*) ──────────────────────────

  void drawTree(const std::string& rootId, SkCanvas* canvas, float w, float h) {
    if (_isDirty.load()) {
      rebuildPicture(rootId, w, h);
    }
    {
      std::lock_guard<std::mutex> lock(_pictureMutex);
      if (_cachedPicture) {
        canvas->drawPicture(_cachedPicture.get());
      }
    }
  }

  // ── Canvas integration (Phase 6E — serialization bridge) ─────────────────

  /**
   * getPictureBytes — serialize SkPicture → bytes để JS reconstruct.
   *
   * Flow:
   *   1. Rebuild nếu dirty
   *   2. SkPicture::serialize() → SkData (Skia built-in serialization)
   *   3. Return bytes → JS sẽ reconstruct qua Skia.MakePicture(bytes)
   *      (Shopify expose qua SkiaApi: Skia.MakePicture(Uint8Array) → SkPicture)
   *
   * Performance: chỉ serialize khi dirty — frame tĩnh = zero overhead.
   * Overhead một lần serialize: ~0.1–2ms tùy độ phức tạp của UI.
   */

  YGSize measureText(const std::string& id, float width, int widthMode, float height, int heightMode) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it != _nodes.end() && it->second->type == "Text") {
      auto textNode = std::static_pointer_cast<TextNode>(it->second);
      return textNode->measure(width, widthMode, height, heightMode);
    }
    return {0, 0};
  }

  std::vector<uint8_t> getPictureBytes(const std::string& rootId, float w, float h) {
    if (_isDirty.load()) {
      rebuildPicture(rootId, w, h);
    }

    std::lock_guard<std::mutex> lock(_pictureMutex);
    if (!_cachedPicture) return {};

    auto data = _cachedPicture->serialize();
    if (!data || data->size() == 0) return {};

    const auto* bytes = static_cast<const uint8_t*>(data->data());
    return std::vector<uint8_t>(bytes, bytes + data->size());
  }

  /**
   * hasPictureData — JS check nhanh xem có data để draw không.
   * Tránh unnecessary getPictureBytes() call khi tree rỗng.
   */
  bool hasPictureData() const {
    std::lock_guard<std::mutex> lock(_pictureMutex);
    return _cachedPicture != nullptr;
  }

private:
  void insertNode(const std::string& id, std::shared_ptr<RenderNode> node) {
    std::unique_lock<std::shared_mutex> lock(_nodesMutex);
    _nodes[id] = std::move(node);
    _isDirty.store(true);
  }

  void rebuildPicture(const std::string& rootId, float w, float h) {
    SkRTreeFactory bbhFactory;
    SkPictureRecorder recorder;
    SkCanvas* recordCanvas = recorder.beginRecording(
      SkRect::MakeWH(w, h), &bbhFactory
    );

    {
      std::shared_lock<std::shared_mutex> lock(_nodesMutex);
      auto it = _nodes.find(rootId);
      if (it != _nodes.end()) {
        SKIAKIT_LOG("rebuildPicture: root=%s found, children=%zu, cachedW=%.1f cachedH=%.1f",
          rootId.c_str(), it->second->children.size(),
          it->second->_cachedW, it->second->_cachedH);
        it->second->paint(recordCanvas);
      } else {
        SKIAKIT_LOG("rebuildPicture: root=%s NOT FOUND! _nodes has %zu entries",
          rootId.c_str(), _nodes.size());
      }
    }

    {
      std::lock_guard<std::mutex> lock(_pictureMutex);
      _cachedPicture = recorder.finishRecordingAsPicture();
    }
    _isDirty.store(false);
  }

  void removeRenderNodeRecursive(const std::string& id) {
    // _nodesMutex đã được giữ unique bởi caller
    auto it = _nodes.find(id);
    if (it == _nodes.end()) return;

    // Thu thập child IDs
    std::vector<std::string> childIds;
    {
      std::shared_lock<std::shared_mutex> childLock(it->second->_childrenMutex);
      for (auto& child : it->second->children) {
        childIds.push_back(child->id);
      }
    }

    for (auto& childId : childIds) {
      removeRenderNodeRecursive(childId);
    }

    _nodes.erase(it);
  }

  std::unordered_map<std::string, std::shared_ptr<RenderNode>> _nodes;
  mutable std::shared_mutex _nodesMutex;

  sk_sp<SkPicture> _cachedPicture;
  mutable std::mutex _pictureMutex;
  std::atomic<bool> _isDirty{true};

  sk_sp<skia::textlayout::FontCollection> _fontCollection;
  std::function<void()> _redrawCallback;
};

} // namespace margelo::nitro::skiakit
