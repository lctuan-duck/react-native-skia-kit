#include "HybridUIEngine.hpp"
#include <yoga/Yoga.h>

namespace margelo::nitro::skiakit {

  void HybridUIEngine::registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) {
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

  void HybridUIEngine::unregisterWidget(const std::string& id) {
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

  void HybridUIEngine::registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) {
    _scrollAreas[id] = {id, x, y, w, h, 0.0, horizontal};
  }

  void HybridUIEngine::updateScrollOffset(const std::string& id, double offset) {
    auto it = _scrollAreas.find(id);
    if (it != _scrollAreas.end()) {
      it->second.offset = offset;
    }
  }

  std::vector<std::string> HybridUIEngine::hitTest(double x, double y) {
    double adjustedX = x;
    double adjustedY = y;
    
    // Shift coords based on active scroll areas (replicating JS logic for MVP)
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

  void HybridUIEngine::clear() {
    _nodes.clear();
    _nodeIndexMap.clear();
    _scrollAreas.clear();
    // Free Yoga nodes
    for (auto& pair : _yogaNodes) {
      YGNodeFree(static_cast<YGNodeRef>(pair.second));
    }
    _yogaNodes.clear();
  }

  // ================= YOGA LAYOUT ================= //

  void* HybridUIEngine::getOrCreateYogaNode(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      return it->second;
    }
    YGNodeRef node = YGNodeNew();
    _yogaNodes[id] = node;
    return node;
  }

  HybridUIEngine::~HybridUIEngine() {
    clear();
  }

  void HybridUIEngine::updateLayoutNode(
    const std::string& id, const std::string& flexDirection, const std::string& justifyContent,
    const std::string& alignItems, const std::string& flexWrap, double width, double height,
    double flex, double gap, double paddingTop, double paddingRight, double paddingBottom, double paddingLeft
  ) {
    YGNodeRef node = static_cast<YGNodeRef>(getOrCreateYogaNode(id));

    // Direction
    if (flexDirection == "row") YGNodeStyleSetFlexDirection(node, YGFlexDirectionRow);
    else if (flexDirection == "column") YGNodeStyleSetFlexDirection(node, YGFlexDirectionColumn);

    // Justify
    if (justifyContent == "center") YGNodeStyleSetJustifyContent(node, YGJustifyCenter);
    else if (justifyContent == "flex-end" || justifyContent == "end") YGNodeStyleSetJustifyContent(node, YGJustifyFlexEnd);
    else if (justifyContent == "space-between" || justifyContent == "spaceBetween") YGNodeStyleSetJustifyContent(node, YGJustifySpaceBetween);
    else if (justifyContent == "space-around" || justifyContent == "spaceAround") YGNodeStyleSetJustifyContent(node, YGJustifySpaceAround);
    else YGNodeStyleSetJustifyContent(node, YGJustifyFlexStart);

    // Align Items
    if (alignItems == "center") YGNodeStyleSetAlignItems(node, YGAlignCenter);
    else if (alignItems == "flex-end" || alignItems == "end") YGNodeStyleSetAlignItems(node, YGAlignFlexEnd);
    else if (alignItems == "stretch") YGNodeStyleSetAlignItems(node, YGAlignStretch);
    else YGNodeStyleSetAlignItems(node, YGAlignFlexStart);

    // Wrap
    if (flexWrap == "wrap") YGNodeStyleSetFlexWrap(node, YGWrapWrap);
    else YGNodeStyleSetFlexWrap(node, YGWrapNoWrap);

    // Dimensions
    if (width >= 0) YGNodeStyleSetWidth(node, width);
    else YGNodeStyleSetWidthAuto(node);

    if (height >= 0) YGNodeStyleSetHeight(node, height);
    else YGNodeStyleSetHeightAuto(node);

    // Flex
    if (flex > 0) YGNodeStyleSetFlex(node, flex);

    // Gap
    if (gap > 0) YGNodeStyleSetGap(node, YGGutterAll, gap);

    // Padding
    if (paddingTop >= 0) YGNodeStyleSetPadding(node, YGEdgeTop, paddingTop);
    if (paddingRight >= 0) YGNodeStyleSetPadding(node, YGEdgeRight, paddingRight);
    if (paddingBottom >= 0) YGNodeStyleSetPadding(node, YGEdgeBottom, paddingBottom);
    if (paddingLeft >= 0) YGNodeStyleSetPadding(node, YGEdgeLeft, paddingLeft);
  }

  void HybridUIEngine::setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds) {
    YGNodeRef parent = static_cast<YGNodeRef>(getOrCreateYogaNode(parentId));
    YGNodeRemoveAllChildren(parent);
    
    uint32_t index = 0;
    for (const auto& childId : childrenIds) {
      YGNodeRef child = static_cast<YGNodeRef>(getOrCreateYogaNode(childId));
      YGNodeInsertChild(parent, child, index++);
    }
  }

  void HybridUIEngine::calculateLayout(const std::string& rootId, double width, double height) {
    auto it = _yogaNodes.find(rootId);
    if (it != _yogaNodes.end()) {
      YGNodeRef root = static_cast<YGNodeRef>(it->second);
      float availableWidth = width >= 0 ? (float)width : YGUndefined;
      float availableHeight = height >= 0 ? (float)height : YGUndefined;
      YGNodeCalculateLayout(root, availableWidth, availableHeight, YGDirectionLTR);
    }
  }

  NativeLayoutRect HybridUIEngine::getNodeLayout(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      YGNodeRef node = static_cast<YGNodeRef>(it->second);
      return {
        (double)YGNodeLayoutGetLeft(node),
        (double)YGNodeLayoutGetTop(node),
        (double)YGNodeLayoutGetWidth(node),
        (double)YGNodeLayoutGetHeight(node)
      };
    }
    return {0, 0, 0, 0};
  }

  std::unordered_map<std::string, NativeLayoutRect> HybridUIEngine::getAllLayouts() {
    std::unordered_map<std::string, NativeLayoutRect> result;
    for (const auto& pair : _yogaNodes) {
      YGNodeRef node = static_cast<YGNodeRef>(pair.second);
      result[pair.first] = {
        (double)YGNodeLayoutGetLeft(node),
        (double)YGNodeLayoutGetTop(node),
        (double)YGNodeLayoutGetWidth(node),
        (double)YGNodeLayoutGetHeight(node)
      };
    }
    return result;
  }

}
