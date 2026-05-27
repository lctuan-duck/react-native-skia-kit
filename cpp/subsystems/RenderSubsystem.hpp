#pragma once

#include "../core/RenderNode.hpp"
#include "../core/BoxNode.hpp"
#include "../core/TextNode.hpp"
#include "../core/ImageNode.hpp"
#include "../core/ScrollNode.hpp"
#include "../core/IconNode.hpp"
#include "../../nitrogen/generated/shared/c++/NativeAnimatedStyle.hpp"

#include <string>
#include <unordered_map>
#include <memory>
#include <shared_mutex>
#include <mutex>
#include <atomic>
#include <vector>
#include <functional>
#include <cstdint>
#include <algorithm>
#include <cmath>

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
    insertNode(id, std::move(node));
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

  void insertRenderChildBefore(const std::string& parentId, const std::string& childId, const std::string& beforeChildId) {
    std::unique_lock<std::shared_mutex> lock(_nodesMutex);
    auto pit = _nodes.find(parentId);
    auto cit = _nodes.find(childId);
    if (pit == _nodes.end() || cit == _nodes.end()) {
      SKIAKIT_LOG("insertRenderChildBefore FAILED: parent=%s(%s) child=%s(%s)",
        parentId.c_str(), pit == _nodes.end() ? "NOT FOUND" : "OK",
        childId.c_str(), cit == _nodes.end() ? "NOT FOUND" : "OK");
      return;
    }
    pit->second->insertChildBefore(cit->second, beforeChildId);
    SKIAKIT_LOG("insertRenderChildBefore OK: parent=%s now has %zu children",
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

  void updateAnimatedStyles(const std::string& id, const NativeAnimatedStyle& style) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it != _nodes.end()) {
      // Phase 6 OPT-2: value dedup — only mark dirty if any value actually changed.
      // Avoids unnecessary rebuildPicture when worklet sends identical values
      // (e.g., animation stabilized at final value).
      bool changed = it->second->updateAnimatedStyles(style);
      if (changed) {
        markDirty();
        // Phase 6 OPT-3: record dirty rect for this node for culled redraw
        float x = it->second->_cachedX;
        float y = it->second->_cachedY;
        float w = it->second->_cachedW;
        float h = it->second->_cachedH;
        if (w > 0 && h > 0) {
          std::lock_guard<std::mutex> drLock(_dirtyRectsMutex);
          _dirtyRects.push_back(SkRect::MakeXYWH(x, y, w, h));
        }
      }
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

  /**
   * drawTreeDirect — Vẽ trực tiếp lên GPU canvas từ SkPicture cache.
   *
   * Dành cho C++ Autonomous Renderer (SkiaKitRenderer).
   * Khác với getPictureBytes(): KHÔNG serialize bytes, không tạo ArrayBuffer,
   * không cần JS reconstruct. SkPicture.replay() trực tiếp lên SkCanvas*.
   *
   * Performance: chỉ rebuild khi dirty (SkPicture cache). Scroll chỉ update
   * scroll offset → không rebuild SkPicture, replay picture với offset mới.
   */
  void drawTreeDirect(const std::string& rootId, SkCanvas* canvas, float w, float h) {
    bool rebuilt = false;
    if (_isDirty.load(std::memory_order_acquire)) {
      _lastW = w;
      _lastH = h;
      rebuildPicture(rootId, w, h);
      rebuilt = true;
    }

    // Phase 6 OPT-1: Frame version dedup.
    // Skip GPU flush entirely if nothing has changed since the last rendered frame.
    // _lastRenderedVersion is only read/written on Main Thread (inside renderToCanvas callback),
    // so no atomic needed for it.
    uint64_t currentVersion = _frameVersion.load(std::memory_order_relaxed);
    if (!rebuilt && currentVersion == _lastRenderedVersion) {
      return; // GPU already has this frame — no work to do
    }
    _lastRenderedVersion = currentVersion;

    // Phase 6 OPT-3: Dirty rect culled draw.
    // If only a few nodes changed (small update), clip the canvas to the union of
    // dirty rects + shadow padding. Skia's BBH (R-Tree from SkRTreeFactory) then
    // automatically culls draw commands outside the clip region.
    // For large updates (many dirty rects) or full redraws, skip clipping.
    std::vector<SkRect> dirtyRects;
    {
      std::lock_guard<std::mutex> drLock(_dirtyRectsMutex);
      dirtyRects = std::move(_dirtyRects);
      _dirtyRects.clear();
    }

    std::lock_guard<std::mutex> lock(_pictureMutex);
    if (!_cachedPicture) return;

    // Use dirty rect clip when: few rects AND they don't cover most of the screen
    constexpr int kMaxDirtyRects = 6;
    constexpr float kShadowPad   = 20.f; // extra margin for shadows/border radius
    if (!dirtyRects.empty() && (int)dirtyRects.size() <= kMaxDirtyRects) {
      // Compute union of all dirty rects
      SkRect unionRect = dirtyRects[0];
      for (size_t i = 1; i < dirtyRects.size(); ++i) {
        unionRect.join(dirtyRects[i]);
      }
      // Expand by shadow padding
      unionRect.outset(kShadowPad, kShadowPad);
      // Clamp to canvas bounds
      unionRect.intersect(SkRect::MakeWH(w, h));

      // Only use clip if it covers < 80% of canvas (else full draw is cheaper)
      const float canvasArea = w * h;
      const float dirtyArea  = unionRect.width() * unionRect.height();
      if (canvasArea > 0.f && dirtyArea / canvasArea < 0.8f) {
        canvas->save();
        canvas->clipRect(unionRect);
        canvas->drawPicture(_cachedPicture.get());
        canvas->restore();
        return;
      }
    }

    // Full screen draw (no clip)
    canvas->drawPicture(_cachedPicture.get());
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
    _isDirty.store(false, std::memory_order_release);
    // Phase 6 OPT-1: bump version so drawTreeDirect knows a new picture is ready
    _frameVersion.fetch_add(1, std::memory_order_relaxed);
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

  // Phase 6 OPT-1: Frame version dedup
  // _frameVersion incremented each rebuildPicture — compared with _lastRenderedVersion
  // to skip GPU flush when picture hasn't changed.
  // _lastRenderedVersion is Main Thread-only → no atomic needed.
  std::atomic<uint64_t> _frameVersion{0};
  uint64_t _lastRenderedVersion{UINT64_MAX}; // starts mismatched to force first draw

  // Phase 6 OPT-3: Dirty rect accumulation
  // Nodes accumulate their bounding rects here on updateAnimatedStyles.
  // drawTreeDirect drains this and uses union rect as clip.
  std::vector<SkRect> _dirtyRects;
  mutable std::mutex _dirtyRectsMutex;

  // Lưu lại dimensions từ lần rebuildPicture gần nhất
  float _lastW = 0.f;
  float _lastH = 0.f;

  sk_sp<skia::textlayout::FontCollection> _fontCollection;
  std::function<void()> _redrawCallback;
};

} // namespace margelo::nitro::skiakit
