#pragma once

#include <string>
#include <vector>
#include <memory>
#include <algorithm>
#include <shared_mutex>   // C++17 readers-writer lock
#include <atomic>
#include <functional>

#include <yoga/Yoga.h>

// Forward declare SkCanvas to avoid pulling in Skia headers in every TU
// that only includes RenderNode.hpp
class SkCanvas;

namespace margelo::nitro::skiakit {

/**
 * RenderNode — Base class cho mọi drawable node trong C++ Render Tree.
 *
 * Threading model:
 *   - JS/Reconciler thread  : addChild, removeChild, setCachedLayout (WRITE)
 *   - Skia Render thread    : paint (READ)
 *   - Background threads    : subclass-specific (e.g. ImageNode::loadAsync)
 *
 * _childrenMutex (shared_mutex) bảo vệ cả children vector lẫn _cachedLayout:
 *   - writers dùng unique_lock (exclusive)
 *   - readers (paint) dùng shared_lock (concurrent-safe)
 */
class RenderNode : public std::enable_shared_from_this<RenderNode> {
public:
  const std::string id;
  std::string type;

  std::weak_ptr<RenderNode> parent;
  std::vector<std::shared_ptr<RenderNode>> children;  // guarded by _childrenMutex

  // ── Yoga node (owned) ────────────────────────────────────────────────────
  // Chỉ dùng cho TextNode measure function — KHÔNG gọi YGNodeLayoutGet* trong paint().
  // Layout position được đọc từ _cachedLayout (sync bởi RenderSubsystem::syncLayoutResults).
  YGNodeRef yogaNode = nullptr;

  explicit RenderNode(const std::string& nodeId, const std::string& nodeType)
    : id(nodeId), type(nodeType) {
    yogaNode = YGNodeNew();
    YGNodeSetContext(yogaNode, this);
  }

  virtual ~RenderNode() {
    if (yogaNode) {
      // [FIX] Phải unlink khỏi Yoga parent trước khi free — tránh crash
      YGNodeRef yogaParent = YGNodeGetParent(yogaNode);
      if (yogaParent) {
        YGNodeRemoveChild(yogaParent, yogaNode);
      }
      // KHÔNG dùng YGNodeFreeRecursive — children được quản lý bởi shared_ptr
      YGNodeFree(yogaNode);
      yogaNode = nullptr;
    }
  }

  // ── Cây con (JS/Reconciler thread) ───────────────────────────────────────

  void addChild(const std::shared_ptr<RenderNode>& child) {
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    children.push_back(child);
    child->parent = shared_from_this();
    auto index = static_cast<uint32_t>(children.size() - 1);
    YGNodeInsertChild(yogaNode, child->yogaNode, index);
  }

  void removeChild(const std::shared_ptr<RenderNode>& child) {
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    auto it = std::find(children.begin(), children.end(), child);
    if (it != children.end()) {
      YGNodeRemoveChild(yogaNode, child->yogaNode);
      children.erase(it);
    }
  }

  // ── Layout cache (JS thread writes, Render thread reads) ─────────────────

  /**
   * Được gọi bởi RenderSubsystem::syncLayoutResults() setelah calculateLayout().
   * Cập nhật cached position/size để paint() dùng — không cần Yoga API trong Render thread.
   */
  void setCachedLayout(float x, float y, float w, float h) {
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    _cachedX = x; _cachedY = y; _cachedW = w; _cachedH = h;
  }

  // ── Render (Skia Render thread) ───────────────────────────────────────────

  /**
   * Đệ quy vẽ node này và toàn bộ cây con.
   * Gọi từ RenderSubsystem::drawTree() → SkPictureRecorder.
   */
  virtual void paint(SkCanvas* canvas);

  /**
   * Vẽ chính node này — subclass bắt buộc implement.
   * Được gọi bên trong save/translate/restore của paint().
   */
  virtual void draw(SkCanvas* canvas) = 0;

  // ── Redraw callback (dùng bởi ImageNode) ─────────────────────────────────
  std::function<void()> onRequestRedraw;

  // ── Readers-writer lock + layout cache ───────────────────────────────────
  // PUBLIC vì RenderSubsystem cần truy cập trực tiếp từ ngoài class hierarchy.
  // Không dùng virtual accessor để tránh overhead trong hot path (paint/syncLayout).
  mutable std::shared_mutex _childrenMutex;

  // Layout cache — được set bởi RenderSubsystem::syncLayoutResults()
  float _cachedX = 0.f, _cachedY = 0.f;
  float _cachedW = 0.f, _cachedH = 0.f;

  // ── Worklet-driven Animated Styles (Phase 6F) ─────────────────────────────
  float _opacity = 1.0f;
  // TODO: Add transform matrix later if needed for 'bounce'
  
  void setOpacity(float opacity) {
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    _opacity = opacity;
  }
};

} // namespace margelo::nitro::skiakit
