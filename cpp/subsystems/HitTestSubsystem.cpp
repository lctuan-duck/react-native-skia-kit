#include "HitTestSubsystem.hpp"
#include <algorithm>

namespace margelo::nitro::skiakit {

  // Initialize with a large boundary (e.g. 10000x10000) for the QuadTree
  HitTestSubsystem::HitTestSubsystem() 
    : _staticTree(AABB{-5000, -5000, 20000, 20000}, 16) {
  }

  static uint64_t g_hitTestOrderCounter = 0;

  void HitTestSubsystem::registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) {
    auto it = _allWidgets.find(id);
    uint64_t order = (it != _allWidgets.end()) ? it->second.order : ++g_hitTestOrderCounter;
    
    WidgetNode node = {id, x, y, w, h, zIndex, behavior, order};
    
    // Lưu lại thông tin nguyên gốc
    _allWidgets[id] = node;

    // Xem widget này có đang là dynamic không
    bool isDynamic = _dynamicStatusMap[id];

    if (isDynamic) {
      // Cập nhật trong mảng dynamic
      bool found = false;
      for (auto& n : _dynamicNodes) {
        if (n.id == id) {
          n = node;
          found = true;
          break;
        }
      }
      if (!found) {
        _dynamicNodes.push_back(node);
      }
    } else {
      // Cập nhật trong QuadTree (xoá cũ, thêm mới)
      _staticTree.remove(id);
      _staticTree.insert(node);
    }
  }

  void HitTestSubsystem::updateWidgetLayout(const std::string& id, double x, double y, double w, double h) {
    auto it = _allWidgets.find(id);
    // Only update layout for widgets that have been explicitly registered as interactive
    if (it != _allWidgets.end()) {
      // Chỉ update nếu toạ độ thực sự thay đổi
      if (it->second.x == x && it->second.y == y && it->second.w == w && it->second.h == h) {
        // Fall through to check scroll areas below
      } else {
        // Keep existing zIndex and behavior, but update coordinates
        WidgetNode updatedNode = it->second;
        updatedNode.x = x;
        updatedNode.y = y;
        updatedNode.w = w;
        updatedNode.h = h;
        
        _allWidgets[id] = updatedNode;
        
        if (_dynamicStatusMap[id]) {
          for (auto& n : _dynamicNodes) {
            if (n.id == id) {
              n = updatedNode;
              break;
            }
          }
        } else {
          // Update in QuadTree
          _staticTree.remove(id);
          _staticTree.insert(updatedNode);
        }
      }
    }

    // CRITICAL: Update scroll area layout so hit testing can find it!
    auto scrollIt = _scrollAreas.find(id);
    if (scrollIt != _scrollAreas.end()) {
      scrollIt->second.x = x;
      scrollIt->second.y = y;
      scrollIt->second.w = w;
      scrollIt->second.h = h;
    }
  }

  void HitTestSubsystem::updatePointerEvents(const std::string& id, const std::string& pointerEvents) {
    auto it = _allWidgets.find(id);
    if (it != _allWidgets.end()) {
      WidgetNode updatedNode = it->second;
      updatedNode.pointerEvents = pointerEvents;
      _allWidgets[id] = updatedNode;

      if (_dynamicStatusMap[id]) {
        for (auto& n : _dynamicNodes) {
          if (n.id == id) {
            n = updatedNode;
            break;
          }
        }
      } else {
        _staticTree.remove(id);
        _staticTree.insert(updatedNode);
      }
    }
  }

  void HitTestSubsystem::unregisterWidget(const std::string& id) {
    _allWidgets.erase(id);
    _dynamicStatusMap.erase(id);
    _scrollAreas.erase(id); // Automatically clean up ScrollArea when widget unregisters

    // Xoá ở cả 2 nơi cho an toàn
    _staticTree.remove(id);
    
    _dynamicNodes.erase(std::remove_if(_dynamicNodes.begin(), _dynamicNodes.end(),
      [&id](const WidgetNode& n) { return n.id == id; }), _dynamicNodes.end());
  }

  void HitTestSubsystem::registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) {
    _scrollAreas[id] = {id, x, y, w, h, 0.0, horizontal};
  }

  void HitTestSubsystem::updateScrollOffset(const std::string& id, double offset) {
    auto it = _scrollAreas.find(id);
    if (it != _scrollAreas.end()) {
      it->second.offset = offset;
    }
  }

  std::vector<NativeHitResult> HitTestSubsystem::hitTest(double x, double y) {
    double adjustedX = x;
    double adjustedY = y;
    
    // Shift coords based on active scroll areas
    // FIX: Chỉ apply scroll offset khi scroll area có kích thước thực sự (w > 0 && h > 0).
    // display:none tabs có scroll area size = 0, nếu vẫn áp offset → adjustedX/Y sai
    // → toàn bộ hit test fail (user không click/scroll được).
    for (auto& pair : _scrollAreas) {
      auto& area = pair.second;
      if (area.w <= 0 || area.h <= 0) continue; // Skip zero-size areas (display:none tabs)
      if (x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h) {
        if (area.horizontal) {
          adjustedX += area.offset;
        } else {
          adjustedY += area.offset;
        }
      }
    }

    std::vector<WidgetNode> hits;

    // 1. Quét QuadTree tĩnh (O(log N))
    _staticTree.hitTest(adjustedX, adjustedY, hits);

    // 2. Quét danh sách Dynamic (O(N) - N cực nhỏ)
    for (const auto& node : _dynamicNodes) {
      if (node.w <= 0 || node.h <= 0) continue; // Skip zero-size (display:none)
      if (adjustedX >= node.x && adjustedX <= node.x + node.w &&
          adjustedY >= node.y && adjustedY <= node.y + node.h) {
        hits.push_back(node);
      }
    }

    // 3. Re-inject ScrollAreas that intersect the ORIGINAL unadjusted x, y
    // Because adjustedX/Y will miss the ScrollView's own static bounds!
    for (auto& pair : _scrollAreas) {
      auto& area = pair.second;
      if (area.w <= 0 || area.h <= 0) continue; // Skip zero-size (display:none)
      if (x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h) {
        auto it = _allWidgets.find(area.id);
        if (it != _allWidgets.end()) {
          // Check if it's already in hits (unlikely, but just in case offset is 0)
          bool exists = false;
          for (const auto& n : hits) {
            if (n.id == area.id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            hits.push_back(it->second);
          }
        }
      }
    }

    // Sort by zIndex descending, then by insertion order descending (children/later inserted appear first)
    std::sort(hits.begin(), hits.end(), [](const WidgetNode& a, const WidgetNode& b) {
      if (a.zIndex != b.zIndex) return a.zIndex > b.zIndex;
      return a.order > b.order;
    });

    std::vector<NativeHitResult> result;
    for (const auto& node : hits) {
      if (node.pointerEvents == "none") {
        continue;
      }
      result.push_back(NativeHitResult(node.id, adjustedX - node.x, adjustedY - node.y));
      // behavior 1 = opaque, stops propagation
      if (node.behavior == 1.0) {
        break;
      }
    }
    return result;
  }

  void HitTestSubsystem::clear() {
    _staticTree.clear();
    _dynamicNodes.clear();
    _allWidgets.clear();
    _dynamicStatusMap.clear();
    _scrollAreas.clear();
  }

}
