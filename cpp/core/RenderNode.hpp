#pragma once

#include <string>
#include <vector>
#include <memory>
#include <algorithm>
#include <array>
#include "../../nitrogen/generated/shared/c++/NativeAnimatedStyle.hpp"
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

  void insertChildBefore(const std::shared_ptr<RenderNode>& child, const std::string& beforeId) {
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    auto it = std::find_if(children.begin(), children.end(), 
                           [&beforeId](const std::shared_ptr<RenderNode>& c) { return c->id == beforeId; });
    if (it != children.end()) {
      auto index = static_cast<uint32_t>(std::distance(children.begin(), it));
      children.insert(it, child);
      child->parent = shared_from_this();
      YGNodeInsertChild(yogaNode, child->yogaNode, index);
    } else {
      children.push_back(child);
      child->parent = shared_from_this();
      auto index = static_cast<uint32_t>(children.size() - 1);
      YGNodeInsertChild(yogaNode, child->yogaNode, index);
    }
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

  std::atomic<float> _cachedLayout[4] = {0, 0, 0, 0};
  
  // ── Animation Transform & Paint Properties ───────────────────────────────
  
  // Transform 2D/3D
  std::atomic<float> _scaleX{1.0f};
  std::atomic<float> _scaleY{1.0f};
  std::atomic<float> _translateX{0.0f};
  std::atomic<float> _translateY{0.0f};
  std::atomic<float> _rotateZ{0.0f};
  std::atomic<float> _rotateX{0.0f};
  std::atomic<float> _rotateY{0.0f};
  std::atomic<float> _skewX{0.0f};
  std::atomic<float> _skewY{0.0f};
  std::atomic<float> _perspective{0.0f}; // 0 = disabled
  std::atomic<float> _transformOriginX{-1.0f}; // -1 = center
  std::atomic<float> _transformOriginY{-1.0f}; // -1 = center

  // Visual & Layering
  std::atomic<float> _opacity{1.0f};
  std::atomic<uint32_t> _backgroundColor{0}; // 0 = SK_ColorTRANSPARENT
  std::atomic<int32_t> _zIndex{0};

  // Interaction
  std::mutex _pointerEventsMutex;
  std::string _pointerEvents = "auto";

  void setCachedLayout(float x, float y, float w, float h) {
    _cachedLayout[0].store(x, std::memory_order_relaxed);
    _cachedLayout[1].store(y, std::memory_order_relaxed);
    _cachedLayout[2].store(w, std::memory_order_relaxed);
    _cachedLayout[3].store(h, std::memory_order_relaxed);
    
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    _cachedX = x;
    _cachedY = y;
    _cachedW = w;
    _cachedH = h;
  }

  virtual void updateAnimatedStyles(const NativeAnimatedStyle& style) {
    if (style.opacity.has_value()) _opacity.store(style.opacity.value(), std::memory_order_relaxed);
    
    if (style.scale.has_value()) {
      _scaleX.store(style.scale.value(), std::memory_order_relaxed);
      _scaleY.store(style.scale.value(), std::memory_order_relaxed);
    }
    if (style.scaleX.has_value()) _scaleX.store(style.scaleX.value(), std::memory_order_relaxed);
    if (style.scaleY.has_value()) _scaleY.store(style.scaleY.value(), std::memory_order_relaxed);
    
    if (style.translateX.has_value()) _translateX.store(style.translateX.value(), std::memory_order_relaxed);
    if (style.translateY.has_value()) _translateY.store(style.translateY.value(), std::memory_order_relaxed);
    
    if (style.rotateZ.has_value()) _rotateZ.store(style.rotateZ.value(), std::memory_order_relaxed);
    if (style.rotateX.has_value()) _rotateX.store(style.rotateX.value(), std::memory_order_relaxed);
    if (style.rotateY.has_value()) _rotateY.store(style.rotateY.value(), std::memory_order_relaxed);
    
    if (style.skewX.has_value()) _skewX.store(style.skewX.value(), std::memory_order_relaxed);
    if (style.skewY.has_value()) _skewY.store(style.skewY.value(), std::memory_order_relaxed);
    
    if (style.perspective.has_value()) _perspective.store(style.perspective.value(), std::memory_order_relaxed);
    if (style.transformOriginX.has_value()) _transformOriginX.store(style.transformOriginX.value(), std::memory_order_relaxed);
    if (style.transformOriginY.has_value()) _transformOriginY.store(style.transformOriginY.value(), std::memory_order_relaxed);
    
    if (style.backgroundColor.has_value()) _backgroundColor.store(style.backgroundColor.value(), std::memory_order_relaxed);
    if (style.zIndex.has_value()) _zIndex.store(style.zIndex.value(), std::memory_order_relaxed);
    
    if (style.pointerEvents.has_value()) {
      std::lock_guard<std::mutex> lock(_pointerEventsMutex);
      _pointerEvents = style.pointerEvents.value();
    }
  }

  // ── Render loop (Skia Render thread) ───────────────────────────────────────────

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
  // TODO: Add transform matrix later if needed for 'bounce'
};

} // namespace margelo::nitro::skiakit
