#include "HitTestSubsystem.hpp"
#include <algorithm>

namespace margelo::nitro::skiakit {

  void HitTestSubsystem::registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) {
    auto it = _nodeIndexMap.find(id);
    if (it != _nodeIndexMap.end()) {
      auto& node = _nodes[it->second];
      node.x = x;
      node.y = y;
      node.w = w;
      node.h = h;
      node.zIndex = zIndex;
      node.behavior = behavior;
    } else {
      _nodeIndexMap[id] = _nodes.size();
      _nodes.push_back({id, x, y, w, h, zIndex, behavior});
    }
  }

  void HitTestSubsystem::unregisterWidget(const std::string& id) {
    auto it = _nodeIndexMap.find(id);
    if (it != _nodeIndexMap.end()) {
      size_t index = it->second;
      // swap and pop for O(1) removal
      if (index < _nodes.size() - 1) {
        _nodes[index] = std::move(_nodes.back());
        _nodeIndexMap[_nodes[index].id] = index;
      }
      _nodes.pop_back();
      _nodeIndexMap.erase(id);
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

  std::vector<std::string> HitTestSubsystem::hitTest(double x, double y) {
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

    std::vector<WidgetNode*> hits;
    for (auto& node : _nodes) {
      if (adjustedX >= node.x && adjustedX <= node.x + node.w && adjustedY >= node.y && adjustedY <= node.y + node.h) {
        hits.push_back(&node);
      }
    }

    // Sort by zIndex descending
    std::sort(hits.begin(), hits.end(), [](WidgetNode* a, WidgetNode* b) {
      return a->zIndex > b->zIndex;
    });

    std::vector<std::string> result;
    for (auto* node : hits) {
      result.push_back(node->id);
      // behavior 1 = opaque, stops propagation
      if (node->behavior == 1.0) {
        break;
      }
    }
    return result;
  }

  void HitTestSubsystem::clear() {
    _nodes.clear();
    _nodeIndexMap.clear();
    _scrollAreas.clear();
  }

}
