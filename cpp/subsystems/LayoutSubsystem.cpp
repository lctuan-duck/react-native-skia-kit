#include "LayoutSubsystem.hpp"
#include <yoga/Yoga.h>

namespace margelo::nitro::skiakit {

  void* LayoutSubsystem::getOrCreateYogaNode(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      return it->second;
    }
    YGNodeRef node = YGNodeNew();
    _yogaNodes[id] = node;
    return node;
  }

  LayoutSubsystem::~LayoutSubsystem() {
    clear();
  }

  void LayoutSubsystem::updateLayoutNode(
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

  void LayoutSubsystem::removeLayoutNode(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      YGNodeRef node = static_cast<YGNodeRef>(it->second);
      // Remove from parent if needed, Yoga handles some of this but we should free it.
      YGNodeFree(node);
      _yogaNodes.erase(it);
    }
  }

  void LayoutSubsystem::setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds) {
    YGNodeRef parent = static_cast<YGNodeRef>(getOrCreateYogaNode(parentId));
    YGNodeRemoveAllChildren(parent);
    
    uint32_t index = 0;
    for (const auto& childId : childrenIds) {
      YGNodeRef child = static_cast<YGNodeRef>(getOrCreateYogaNode(childId));
      YGNodeInsertChild(parent, child, index++);
    }
  }

  void LayoutSubsystem::calculateLayout(const std::string& rootId, double width, double height) {
    auto it = _yogaNodes.find(rootId);
    if (it != _yogaNodes.end()) {
      YGNodeRef root = static_cast<YGNodeRef>(it->second);
      float availableWidth = width >= 0 ? (float)width : YGUndefined;
      float availableHeight = height >= 0 ? (float)height : YGUndefined;
      YGNodeCalculateLayout(root, availableWidth, availableHeight, YGDirectionLTR);
    }
  }

  NativeLayoutRect LayoutSubsystem::getNodeLayout(const std::string& id) {
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

  std::unordered_map<std::string, NativeLayoutRect> LayoutSubsystem::getAllLayouts() {
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

  void LayoutSubsystem::clear() {
    for (auto& pair : _yogaNodes) {
      YGNodeFree(static_cast<YGNodeRef>(pair.second));
    }
    _yogaNodes.clear();
  }

}
