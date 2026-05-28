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

  /**
   * setRedrawCallback — lưu external callback (scheduleRender) và tạo internal
   * wrapper set _animationDirty=true trước khi gọi external callback.
   *
   * FIX: layout transitions gọi onRequestRedraw() từ trong paint().
   * _animationDirty (được check trong drawTreeDirect Path 2) không bị rebuildPicture
   * overwrite (khác với _isDirty). Path 2 dùng direct root->paint() để đọc
   * interpolated positions từng frame → transition animate đúng.
   */
  void setRedrawCallback(std::function<void()> cb) {
    _externalRedrawCallback = std::move(cb);
    // Wrap: set _animationDirty để drawTreeDirect Path 2 chạy (không bị _isDirty overwrite)
    _redrawCallback = [this]() {
      _animationDirty.store(true, std::memory_order_release);
      if (_externalRedrawCallback) _externalRedrawCallback();
    };
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

  /**
   * syncLayoutResults — Sync layout kết quả từ Yoga sang RenderNode cache.
   * Returns true nếu ít nhất 1 node có vị trí/kích thước thay đổi.
   * Caller (doRender) dùng để quyết định có fire JS layout callback không.
   * FIX M4: Tránh fire JS callback mỗi frame dù layout không đổi.
   */
  bool syncLayoutResults(const std::unordered_map<std::string, CachedLayout>& layouts) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    bool anyChanged = false;
    for (auto& [id, layout] : layouts) {
      auto it = _nodes.find(id);
      if (it != _nodes.end()) {
        if (it->second->setCachedLayout(layout.x, layout.y, layout.width, layout.height)) {
          anyChanged = true;
        }
      }
    }
    if (anyChanged) {
      _isDirty.store(true, std::memory_order_release);
    }
    return anyChanged;
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

  /**
   * updateAnimatedStyles — returns true nếu có thay đổi thực sự (để caller
   * quyết định có gọi scheduleRender() không).
   *
   * OPT: Tách loại dirty:
   * - Transform/opacity only → _animationDirty (skip rebuildPicture, draw trực tiếp)
   * - Visual/box props → _isDirty (rebuild bắt buộc)
   */
  bool updateAnimatedStyles(const std::string& id, const NativeAnimatedStyle& style) {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(id);
    if (it == _nodes.end()) return false;

    // Phase 6 OPT-2: value dedup — chỉ dirty khi giá trị thực sự thay đổi.
    bool changed = it->second->updateAnimatedStyles(style);
    if (!changed) return false;

    // Phân loại: transform-only hay cần rebuild visual?
    if (isTransformOnlyUpdate(style)) {
      // Chỉ transform/opacity → skip rebuildPicture, draw trực tiếp
      _animationDirty.store(true, std::memory_order_release);
    } else {
      // Visual/box props thay đổi → rebuild bắt buộc
      markDirty();
    }

    // Phase 6 OPT-3: record dirty rect for culled redraw
    float x = it->second->_cachedX;
    float y = it->second->_cachedY;
    float w = it->second->_cachedW;
    float h = it->second->_cachedH;
    if (w > 0 && h > 0) {
      std::lock_guard<std::mutex> drLock(_dirtyRectsMutex);
      _dirtyRects.push_back(SkRect::MakeXYWH(x, y, w, h));
    }
    return true;
  }

  // ── Dirty flag ────────────────────────────────────────────────────────────

  void markDirty() { _isDirty.store(true, std::memory_order_release); }

  bool isDirty() const { return _isDirty.load(std::memory_order_acquire); }

  /**
   * hasRenderContent — kiểm tra xem root node có children không.
   * Dùng bởi SkiaKitRenderer::attachCanvasProvider để tránh render partial tree
   * khi JS reconciler chưa commit xong (gây flicker ở góc trái khi chuyển tab).
   */
  bool hasRenderContent(const std::string& rootId) const {
    std::shared_lock<std::shared_mutex> lock(_nodesMutex);
    auto it = _nodes.find(rootId);
    if (it == _nodes.end()) return false;
    std::shared_lock<std::shared_mutex> childLock(it->second->_childrenMutex);
    return !it->second->children.empty();
  }

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
   * drawTreeDirect — Vẽ trực tiếp lên GPU canvas.
   *
   * Có 3 paths:
   * 1a. _isDirty=true, _animDirty=false → rebuildPicture + drawPicture
   *     Values đã settle → SkPicture baked đúng, replay nhanh trong PATH3.
   * 1b. _isDirty=true, _animDirty=true  → SKIP rebuild + direct paint (PATH1+anim)
   *     Tránh bake stale transforms vào SkPicture khi animation đang chạy.
   *     _isDirty giữ nguyên → khi animation dừng, PATH1a sẽ rebuild đúng.
   * 2.  _animDirty=true only            → clear + paint() trực tiếp (PATH2)
   * 3.  Không thay đổi                  → frame dedup, skip hoàn toàn (PATH3)
   *
   * Thread safety: chỉ gọi từ Main Thread (doRender đảm bảo).
   */
  void drawTreeDirect(const std::string& rootId, SkCanvas* canvas, float w, float h) {
    bool needsRebuild  = _isDirty.load(std::memory_order_acquire);
    bool needsAnimDraw = _animationDirty.load(std::memory_order_acquire);

    // ── Path 1: Full rebuild ──────────────────────────────────────────────
    if (needsRebuild) {
      _lastW = w;
      _lastH = h;

      // FLICKER FIX (Progress/Thumb với scaleX/translateX animation):
      // Vấn đề: rebuildPicture() bakes transform values (scaleX, translateX) vào
      // SkPicture tại thời điểm rebuild. Nếu animation worklet fires SAU khi doRender
      // bắt đầu (nhưng TRƯỚC khi display): drawPicture hiển thị snapshot stale →
      // progress fill xuất hiện tại vị trí sai 1 frame → "thêm 1 đoạn" / flicker.
      //
      // Giải pháp: Check animation TRƯỚC rebuild.
      // - Nếu animation active: SKIP rebuildPicture hoàn toàn + dùng direct paint
      //   (đọc atomic transform values mới nhất). Giữ _isDirty=true để khi animation
      //   dừng, PATH1 sẽ rebuild SkPicture đúng với values đã settle.
      // - Nếu không có animation: rebuild bình thường (values đã settle) → safe to cache.
      //
      // So sánh với trước: rebuildPicture LUÔN chạy rồi mới check animation.
      // Bug: worklet fires BEFORE doRender → _animationDirty cleared during rebuild check
      //      → animStillActive=false → drawPicture (stale!) → flicker.
      bool animActive = needsAnimDraw; // _animationDirty đã load ở đầu hàm
      if (animActive) {
        SKIAKIT_LOG("drawTreeDirect PATH1+anim(skip-rebuild) root=%s", rootId.c_str());
        // Drain dirty rects
        {
          std::lock_guard<std::mutex> drLock(_dirtyRectsMutex);
          _dirtyRects.clear();
        }
        _animationDirty.store(false, std::memory_order_relaxed);
        // KHÔNG clear _isDirty → khi animation dừng (animDirty=false, isDirty=true)
        // PATH1 sẽ chạy lại và rebuildPicture với values đã settle → SkPicture đúng.
        canvas->clear(SK_ColorTRANSPARENT);
        {
          std::shared_lock<std::shared_mutex> lock(_nodesMutex);
          auto it = _nodes.find(rootId);
          if (it != _nodes.end()) {
            it->second->paint(canvas);
          }
        }
        return;
      }

      // Không có animation active → rebuild SkPicture (values đã settle = safe to cache)
      SKIAKIT_LOG("drawTreeDirect PATH1(rebuild) root=%s w=%.0f h=%.0f", rootId.c_str(), w, h);
      _animationDirty.store(false, std::memory_order_relaxed);
      rebuildPicture(rootId, w, h);

      // Drain dirty rects
      std::vector<SkRect> dirtyRects;
      {
        std::lock_guard<std::mutex> drLock(_dirtyRectsMutex);
        dirtyRects = std::move(_dirtyRects);
      }

      // Không có animation: drawPicture từ baked snapshot (nhanh hơn).
      std::lock_guard<std::mutex> lock(_pictureMutex);
      if (!_cachedPicture) return;

      // Phase 6 OPT-3: Dirty rect culled draw
      constexpr int   kMaxDirtyRects = 6;
      constexpr float kShadowPad     = 20.f;
      if (!dirtyRects.empty() && (int)dirtyRects.size() <= kMaxDirtyRects) {
        SkRect unionRect = dirtyRects[0];
        for (size_t i = 1; i < dirtyRects.size(); ++i) unionRect.join(dirtyRects[i]);
        unionRect.outset(kShadowPad, kShadowPad);
        unionRect.intersect(SkRect::MakeWH(w, h));
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
      canvas->drawPicture(_cachedPicture.get());
      return;
    }

    // ── Path 2: Animation-only draw (skip rebuildPicture) ─────────────────
    // Dùng khi chỉ transform/opacity thay đổi HOẶC khi layout transition
    // yêu cầu redraw (onRequestRedraw → _animationDirty=true).
    //
    // Direct paint: đọc atomic transform values + interpolated positions
    // từng node tại thời điểm hiện tại → không cần rebuild SkPicture.
    //
    // QUAN TRỌNG: KHÔNG dùng dirty rect clip ở đây.
    // Sau canvas->clear(), phải paint TOÀN BỘ cây không có clip.
    // Nếu clip → phần ngoài clip trở thành transparent (màn hình trắng).
    if (needsAnimDraw) {
      SKIAKIT_LOG("drawTreeDirect PATH2(anim) root=%s w=%.0f h=%.0f", rootId.c_str(), w, h);
      // Safeguard: nếu chưa có picture (first frame), force full rebuild
      // để đảm bảo canvas được populate đúng cách trước khi dùng direct draw.
      bool hasPicture = false;
      {
        std::lock_guard<std::mutex> lock(_pictureMutex);
        hasPicture = (_cachedPicture != nullptr);
      }
      if (!hasPicture) {
        // Chưa có picture → rebuild để khởi tạo
        _isDirty.store(true, std::memory_order_release);
        _animationDirty.store(false, std::memory_order_relaxed);
        return drawTreeDirect(rootId, canvas, w, h); // recurse với _isDirty=true
      }

      _animationDirty.store(false, std::memory_order_release);

      // Drain dirty rects (không dùng làm clip — không an toàn sau clear())
      {
        std::lock_guard<std::mutex> drLock(_dirtyRectsMutex);
        _dirtyRects.clear();
      }

      // Clear TOÀN BỘ surface rồi paint TOÀN BỘ cây
      // clear() + full paint = không có ghost artifacts, không có màn hình trắng
      canvas->clear(SK_ColorTRANSPARENT);

      {
        std::shared_lock<std::shared_mutex> lock(_nodesMutex);
        auto it = _nodes.find(rootId);
        if (it != _nodes.end()) {
          it->second->paint(canvas);
        }
      }
      return;
    }

    // ── Path 3: Frame dedup ───────────────────────────────────────────────
    // Phase 6 OPT-1: Skip GPU flush nếu picture không đổi từ frame trước.
    uint64_t currentVersion = _frameVersion.load(std::memory_order_relaxed);
    if (currentVersion == _lastRenderedVersion) {
      SKIAKIT_LOG("drawTreeDirect PATH3(skip/dedup) root=%s ver=%llu", rootId.c_str(), (unsigned long long)currentVersion);
      return; // GPU đã có frame này rồi
    }
    _lastRenderedVersion = currentVersion;

    // Replay picture từ cache (không có gì thay đổi ngoài version bump)
    std::lock_guard<std::mutex> lock(_pictureMutex);
    if (_cachedPicture) {
      canvas->drawPicture(_cachedPicture.get());
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

  // _isDirty: cần rebuildPicture (structure/visual/layout thay đổi)
  std::atomic<bool> _isDirty{true};
  // _animationDirty: chỉ transform/opacity thay đổi → skip rebuildPicture, direct draw
  std::atomic<bool> _animationDirty{false};

  // Phase 6 OPT-1: Frame version dedup
  std::atomic<uint64_t> _frameVersion{0};
  uint64_t _lastRenderedVersion{UINT64_MAX};

  // Phase 6 OPT-3: Dirty rect accumulation
  std::vector<SkRect> _dirtyRects;
  mutable std::mutex _dirtyRectsMutex;

  float _lastW = 0.f;
  float _lastH = 0.f;

  sk_sp<skia::textlayout::FontCollection> _fontCollection;
  // _redrawCallback: internal wrapper (set _animationDirty + gọi external)
  // Dùng _animationDirty thay vì _isDirty để không bị rebuildPicture() overwrite.
  // Cho phép layout transitions animate đúng qua Path 2 (direct paint).
  std::function<void()> _redrawCallback;
  // _externalRedrawCallback: scheduleRender() từ SkiaKitRenderer
  std::function<void()> _externalRedrawCallback;

  /**
   * isTransformOnlyUpdate — kiểm tra NativeAnimatedStyle có chỉ chứa
   * transform/opacity props không (không cần rebuildPicture).
   *
   * Transform-only: opacity, scale*, translate*, rotate*, skew*, perspective,
   *   transformOrigin*, zIndex, pointerEvents, width/height/top/left (anim overrides).
   * Visual (cần rebuild): backgroundColor, border*, gradient, backdropBlur, blend, colorFilter.
   */
  static bool isTransformOnlyUpdate(const NativeAnimatedStyle& style) {
    return !style.backgroundColor.has_value() &&
           !style.borderRadius.has_value() &&
           !style.borderTopLeftRadius.has_value() &&
           !style.borderTopRightRadius.has_value() &&
           !style.borderBottomRightRadius.has_value() &&
           !style.borderBottomLeftRadius.has_value() &&
           !style.borderWidth.has_value() &&
           !style.borderTopWidth.has_value() &&
           !style.borderRightWidth.has_value() &&
           !style.borderBottomWidth.has_value() &&
           !style.borderLeftWidth.has_value() &&
           !style.borderColor.has_value() &&
           !style.borderTopColor.has_value() &&
           !style.borderRightColor.has_value() &&
           !style.borderBottomColor.has_value() &&
           !style.borderLeftColor.has_value() &&
           !style.borderStyle.has_value() &&
           !style.dashLength.has_value() &&
           !style.dashSpacing.has_value() &&
           !style.gradient.has_value() &&
           !style.backdropBlurRadius.has_value() &&
           !style.blendMode.has_value() &&
           !style.colorFilter.has_value() &&
           !style.shadowColor.has_value() &&
           !style.shadowBlur.has_value() &&
           !style.shadowOffsetX.has_value() &&
           !style.shadowOffsetY.has_value() &&
           !style.shadowOpacity.has_value() &&
           !style.shadowSpread.has_value() &&
           !style.shadowType.has_value();
  }
};

} // namespace margelo::nitro::skiakit

