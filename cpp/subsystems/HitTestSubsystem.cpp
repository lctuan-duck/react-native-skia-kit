#include "HitTestSubsystem.hpp"
#include <algorithm>

namespace margelo::nitro::skiakit {

  // Initialize with a large boundary (e.g. 10000x10000) for the QuadTree
  HitTestSubsystem::HitTestSubsystem() 
    : _staticTree(AABB{-5000, -5000, 20000, 20000}, 16) {
  }

  void HitTestSubsystem::registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) {
    WidgetNode node = {id, x, y, w, h, zIndex, behavior};
    
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
    double zIndex = 0.0;
    double behavior = 0.0; // default to translucent
    
    if (it != _allWidgets.end()) {
      // Chỉ update nếu toạ độ thực sự thay đổi
      if (it->second.x == x && it->second.y == y && it->second.w == w && it->second.h == h) {
        return; 
      }
      zIndex = it->second.zIndex;
      behavior = it->second.behavior;
    }
    
    registerWidget(id, x, y, w, h, zIndex, behavior);
  }

  void HitTestSubsystem::unregisterWidget(const std::string& id) {
    _allWidgets.erase(id);
    _dynamicStatusMap.erase(id);

    // Xoá ở cả 2 nơi cho an toàn
    _staticTree.remove(id);
    
    _dynamicNodes.erase(std::remove_if(_dynamicNodes.begin(), _dynamicNodes.end(),
      [&id](const WidgetNode& n) { return n.id == id; }), _dynamicNodes.end());
  }

  void HitTestSubsystem::setWidgetDynamic(const std::string& id, bool isDynamic) {
    auto it = _allWidgets.find(id);
    if (it == _allWidgets.end()) return;

    bool currentStatus = _dynamicStatusMap[id];
    if (currentStatus == isDynamic) return; // Không đổi

    _dynamicStatusMap[id] = isDynamic;

    if (isDynamic) {
      // Chuyển từ Static -> Dynamic
      _staticTree.remove(id);
      _dynamicNodes.push_back(it->second);
    } else {
      // Chuyển từ Dynamic -> Static
      _dynamicNodes.erase(std::remove_if(_dynamicNodes.begin(), _dynamicNodes.end(),
        [&id](const WidgetNode& n) { return n.id == id; }), _dynamicNodes.end());
      _staticTree.insert(it->second);
    }
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
    for (auto& pair : _scrollAreas) {
      auto& area = pair.second;
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
      if (adjustedX >= node.x && adjustedX <= node.x + node.w &&
          adjustedY >= node.y && adjustedY <= node.y + node.h) {
        hits.push_back(node);
      }
    }

    // Sort by zIndex descending
    std::sort(hits.begin(), hits.end(), [](const WidgetNode& a, const WidgetNode& b) {
      return a.zIndex > b.zIndex;
    });

    std::vector<NativeHitResult> result;
    for (const auto& node : hits) {
      result.push_back({node.id, adjustedX - node.x, adjustedY - node.y});
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
