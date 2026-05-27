#pragma once

#include <string>
#include <vector>
#include <memory>
#include <algorithm>
#include <array>
#include "../../nitrogen/generated/shared/c++/NativeAnimatedStyle.hpp"
#include <shared_mutex>   // C++17 readers-writer lock
#include <atomic>
#include <chrono>
#include <cmath>
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
      if (yogaParent && YGNodeGetParent(yogaNode) == yogaParent) {
        YGNodeRemoveChild(yogaParent, yogaNode);
      }
      // KHÔNG dùng YGNodeFreeRecursive — children được quản lý bởi shared_ptr
      YGNodeFree(yogaNode);
      yogaNode = nullptr;
    }
  }

  // ── Cây con (JS/Reconciler thread) ───────────────────────────────────────

  void addChild(const std::shared_ptr<RenderNode>& child) {
    if (!child) return;

    // 1. Unlink from old C++ parent if any (clears old parent's children & yogaNode)
    if (auto oldParent = child->parent.lock()) {
      oldParent->removeChild(child);
    }

    // 2. Extra safety unlinking in case C++ parent pointer was somehow missing/null but Yoga parent exists
    YGNodeRef childYogaParent = YGNodeGetParent(child->yogaNode);
    if (childYogaParent && YGNodeGetParent(child->yogaNode) == childYogaParent) {
      YGNodeRemoveChild(childYogaParent, child->yogaNode);
    }

    std::unique_lock<std::shared_mutex> lock(_childrenMutex);

    // 3. Remove duplicate child reference from children vector if any exists
    auto it = std::find(children.begin(), children.end(), child);
    if (it != children.end()) {
      children.erase(it);
    }

    children.push_back(child);
    child->parent = shared_from_this();

    // 4. Insert into Yoga node at the end (safely using current child count)
    uint32_t yogaCount = YGNodeGetChildCount(yogaNode);
    YGNodeInsertChild(yogaNode, child->yogaNode, yogaCount);
  }

  void insertChildBefore(const std::shared_ptr<RenderNode>& child, const std::string& beforeId) {
    if (!child) return;

    // 1. Unlink from old C++ parent if any
    if (auto oldParent = child->parent.lock()) {
      oldParent->removeChild(child);
    }

    // 2. Extra safety unlinking in case Yoga parent exists
    YGNodeRef childYogaParent = YGNodeGetParent(child->yogaNode);
    if (childYogaParent && YGNodeGetParent(child->yogaNode) == childYogaParent) {
      YGNodeRemoveChild(childYogaParent, child->yogaNode);
    }

    std::unique_lock<std::shared_mutex> lock(_childrenMutex);

    // 3. Remove duplicate child reference from children vector if any exists
    auto dupIt = std::find(children.begin(), children.end(), child);
    if (dupIt != children.end()) {
      children.erase(dupIt);
    }

    // 4. Find beforeId insertion position
    auto it = std::find_if(children.begin(), children.end(), 
                           [&beforeId](const std::shared_ptr<RenderNode>& c) { return c->id == beforeId; });

    uint32_t index = 0;
    if (it != children.end()) {
      index = static_cast<uint32_t>(std::distance(children.begin(), it));
      children.insert(it, child);
    } else {
      children.push_back(child);
      index = static_cast<uint32_t>(children.size() - 1);
    }

    child->parent = shared_from_this();

    // 5. Insert into Yoga node at the computed index (safety bounded by current child count)
    uint32_t yogaCount = YGNodeGetChildCount(yogaNode);
    if (index > yogaCount) {
      index = yogaCount;
    }
    YGNodeInsertChild(yogaNode, child->yogaNode, index);
  }

  void removeChild(const std::shared_ptr<RenderNode>& child) {
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    auto it = std::find(children.begin(), children.end(), child);
    if (it != children.end()) {
      if (YGNodeGetParent(child->yogaNode) == yogaNode) {
        YGNodeRemoveChild(yogaNode, child->yogaNode);
      }
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

  /**
   * Returns the current ease-out-quad progress [0, 1] of the layout transition,
   * OR -1.0f if no transition is active.
   *
   * Atomically resets _inLayoutTransition when the duration has elapsed so that
   * ALL four getters (X/Y/W/H) observe a consistent state within the same paint
   * call — preventing a one-frame geometry glitch where one axis snaps to the
   * target while the others are still interpolating.
   */
  float _getTransitionProgress() const {
    if (!_inLayoutTransition.load(std::memory_order_relaxed)) {
      return -1.0f;
    }
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
      std::chrono::steady_clock::now() - _layoutTransitionStartTime
    ).count();
    if (elapsed >= 250) {
      // Transition complete — reset flag once, all getters will see -1 next call
      _inLayoutTransition.store(false, std::memory_order_relaxed);
      return -1.0f; // Callers fall through to target value
    }
    float t = static_cast<float>(elapsed) / 250.0f;
    return t * (2.0f - t); // Ease-out quad
  }

  float getWidthInternal() const {
    if (_hasAnimWidth.load(std::memory_order_relaxed)) {
      return _animWidth.load(std::memory_order_relaxed);
    }
    float tp = _getTransitionProgress();
    if (tp >= 0.0f) {
      return _transitionStartW + (_transitionTargetW - _transitionStartW) * tp;
    }
    // tp == -1: either never started or just finished → use target/cached
    return _inLayoutTransition.load(std::memory_order_relaxed) ? _transitionTargetW : _cachedW;
  }

  float getHeightInternal() const {
    if (_hasAnimHeight.load(std::memory_order_relaxed)) {
      return _animHeight.load(std::memory_order_relaxed);
    }
    float tp = _getTransitionProgress();
    if (tp >= 0.0f) {
      return _transitionStartH + (_transitionTargetH - _transitionStartH) * tp;
    }
    return _inLayoutTransition.load(std::memory_order_relaxed) ? _transitionTargetH : _cachedH;
  }

  float getXInternal() const {
    if (_hasAnimLeft.load(std::memory_order_relaxed)) {
      return _animLeft.load(std::memory_order_relaxed);
    }
    float tp = _getTransitionProgress();
    if (tp >= 0.0f) {
      return _transitionStartX + (_transitionTargetX - _transitionStartX) * tp;
    }
    return _inLayoutTransition.load(std::memory_order_relaxed) ? _transitionTargetX : _cachedX;
  }

  float getYInternal() const {
    if (_hasAnimTop.load(std::memory_order_relaxed)) {
      return _animTop.load(std::memory_order_relaxed);
    }
    float tp = _getTransitionProgress();
    if (tp >= 0.0f) {
      return _transitionStartY + (_transitionTargetY - _transitionStartY) * tp;
    }
    return _inLayoutTransition.load(std::memory_order_relaxed) ? _transitionTargetY : _cachedY;
  }

  bool _hasFirstLayout = false;

  void setCachedLayout(float x, float y, float w, float h) {
    std::unique_lock<std::shared_mutex> lock(_childrenMutex);
    
    // Animate layout updates if node is already initialized (first layout done)
    if (_layoutTransitionEnabled.load(std::memory_order_relaxed) && _hasFirstLayout) {
      bool changed = (std::abs(_cachedX - x) > 0.1f || std::abs(_cachedY - y) > 0.1f ||
                      std::abs(_cachedW - w) > 0.1f || std::abs(_cachedH - h) > 0.1f);
      if (changed) {
        // Start from current animated values to prevent jumps
        _transitionStartX = getXInternal();
        _transitionStartY = getYInternal();
        _transitionStartW = getWidthInternal();
        _transitionStartH = getHeightInternal();

        _transitionTargetX = x;
        _transitionTargetY = y;
        _transitionTargetW = w;
        _transitionTargetH = h;

        _layoutTransitionStartTime = std::chrono::steady_clock::now();
        _inLayoutTransition.store(true, std::memory_order_relaxed);
        
        if (onRequestRedraw) {
          onRequestRedraw();
        }
      }
    }

    _cachedX = x;
    _cachedY = y;
    _cachedW = w;
    _cachedH = h;
    _hasFirstLayout = true;

    _cachedLayout[0].store(x, std::memory_order_relaxed);
    _cachedLayout[1].store(y, std::memory_order_relaxed);
    _cachedLayout[2].store(w, std::memory_order_relaxed);
    _cachedLayout[3].store(h, std::memory_order_relaxed);
  }

  float getWidth() const {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    return getWidthInternal();
  }

  float getHeight() const {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    return getHeightInternal();
  }

  float getX() const {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    return getXInternal();
  }

  float getY() const {
    std::shared_lock<std::shared_mutex> lock(_childrenMutex);
    return getYInternal();
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

    // Phase 4: Layout animated overrides
    if (style.left.has_value()) {
      if (std::holds_alternative<double>(style.left.value())) {
        _animLeft.store(static_cast<float>(std::get<double>(style.left.value())), std::memory_order_relaxed);
        _hasAnimLeft.store(true, std::memory_order_relaxed);
      } else {
        _hasAnimLeft.store(false, std::memory_order_relaxed);
      }
    }
    if (style.top.has_value()) {
      if (std::holds_alternative<double>(style.top.value())) {
        _animTop.store(static_cast<float>(std::get<double>(style.top.value())), std::memory_order_relaxed);
        _hasAnimTop.store(true, std::memory_order_relaxed);
      } else {
        _hasAnimTop.store(false, std::memory_order_relaxed);
      }
    }
    if (style.width.has_value()) {
      if (std::holds_alternative<double>(style.width.value())) {
        _animWidth.store(static_cast<float>(std::get<double>(style.width.value())), std::memory_order_relaxed);
        _hasAnimWidth.store(true, std::memory_order_relaxed);
      } else {
        _hasAnimWidth.store(false, std::memory_order_relaxed);
      }
    }
    if (style.height.has_value()) {
      if (std::holds_alternative<double>(style.height.value())) {
        _animHeight.store(static_cast<float>(std::get<double>(style.height.value())), std::memory_order_relaxed);
        _hasAnimHeight.store(true, std::memory_order_relaxed);
      } else {
        _hasAnimHeight.store(false, std::memory_order_relaxed);
      }
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
  std::atomic<float> _animLeft{0.0f};
  std::atomic<bool> _hasAnimLeft{false};
  std::atomic<float> _animTop{0.0f};
  std::atomic<bool> _hasAnimTop{false};
  std::atomic<float> _animWidth{0.0f};
  std::atomic<bool> _hasAnimWidth{false};
  std::atomic<float> _animHeight{0.0f};
  std::atomic<bool> _hasAnimHeight{false};

  // Layout transition support (Phase 4)
  std::atomic<bool> _layoutTransitionEnabled{true};
  mutable std::atomic<bool> _inLayoutTransition{false};
  std::chrono::steady_clock::time_point _layoutTransitionStartTime;
  
  float _transitionStartX = 0.0f;
  float _transitionStartY = 0.0f;
  float _transitionStartW = 0.0f;
  float _transitionStartH = 0.0f;
  
  float _transitionTargetX = 0.0f;
  float _transitionTargetY = 0.0f;
  float _transitionTargetW = 0.0f;
  float _transitionTargetH = 0.0f;
};

} // namespace margelo::nitro::skiakit
