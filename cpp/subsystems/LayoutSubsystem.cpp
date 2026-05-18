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

  void LayoutSubsystem::updateLayoutNode(const std::string& id, const NativeYogaStyle& style) {
    YGNodeRef node = static_cast<YGNodeRef>(getOrCreateYogaNode(id));

    // === Flex Direction ===
    if (style.flexDirection.has_value()) {
      const auto& v = style.flexDirection.value();
      if (v == "row") YGNodeStyleSetFlexDirection(node, YGFlexDirectionRow);
      else if (v == "row-reverse") YGNodeStyleSetFlexDirection(node, YGFlexDirectionRowReverse);
      else if (v == "column-reverse") YGNodeStyleSetFlexDirection(node, YGFlexDirectionColumnReverse);
      else YGNodeStyleSetFlexDirection(node, YGFlexDirectionColumn);
    }

    // === Justify Content ===
    if (style.justifyContent.has_value()) {
      const auto& v = style.justifyContent.value();
      if (v == "center") YGNodeStyleSetJustifyContent(node, YGJustifyCenter);
      else if (v == "flex-end" || v == "end") YGNodeStyleSetJustifyContent(node, YGJustifyFlexEnd);
      else if (v == "space-between" || v == "spaceBetween") YGNodeStyleSetJustifyContent(node, YGJustifySpaceBetween);
      else if (v == "space-around" || v == "spaceAround") YGNodeStyleSetJustifyContent(node, YGJustifySpaceAround);
      else if (v == "space-evenly" || v == "spaceEvenly") YGNodeStyleSetJustifyContent(node, YGJustifySpaceEvenly);
      else YGNodeStyleSetJustifyContent(node, YGJustifyFlexStart);
    }

    // === Align Items ===
    if (style.alignItems.has_value()) {
      const auto& v = style.alignItems.value();
      if (v == "center") YGNodeStyleSetAlignItems(node, YGAlignCenter);
      else if (v == "flex-end" || v == "end") YGNodeStyleSetAlignItems(node, YGAlignFlexEnd);
      else if (v == "stretch") YGNodeStyleSetAlignItems(node, YGAlignStretch);
      else if (v == "baseline") YGNodeStyleSetAlignItems(node, YGAlignBaseline);
      else YGNodeStyleSetAlignItems(node, YGAlignFlexStart);
    }

    // === Flex Wrap ===
    if (style.flexWrap.has_value()) {
      const auto& v = style.flexWrap.value();
      if (v == "wrap") YGNodeStyleSetFlexWrap(node, YGWrapWrap);
      else if (v == "wrap-reverse") YGNodeStyleSetFlexWrap(node, YGWrapWrapReverse);
      else YGNodeStyleSetFlexWrap(node, YGWrapNoWrap);
    }

    // === Dimensions ===
    if (style.width.has_value()) YGNodeStyleSetWidth(node, style.width.value());
    if (style.height.has_value()) YGNodeStyleSetHeight(node, style.height.value());

    // === Flex Child ===
    if (style.flex.has_value()) YGNodeStyleSetFlex(node, style.flex.value());
    if (style.flexGrow.has_value()) YGNodeStyleSetFlexGrow(node, style.flexGrow.value());
    if (style.flexShrink.has_value()) YGNodeStyleSetFlexShrink(node, style.flexShrink.value());
    if (style.flexBasis.has_value()) YGNodeStyleSetFlexBasis(node, style.flexBasis.value());

    // === Align Self ===
    if (style.alignSelf.has_value()) {
      const auto& v = style.alignSelf.value();
      if (v == "center") YGNodeStyleSetAlignSelf(node, YGAlignCenter);
      else if (v == "flex-end" || v == "end") YGNodeStyleSetAlignSelf(node, YGAlignFlexEnd);
      else if (v == "flex-start" || v == "start") YGNodeStyleSetAlignSelf(node, YGAlignFlexStart);
      else if (v == "stretch") YGNodeStyleSetAlignSelf(node, YGAlignStretch);
      else if (v == "baseline") YGNodeStyleSetAlignSelf(node, YGAlignBaseline);
      else YGNodeStyleSetAlignSelf(node, YGAlignAuto);
    }

    // === Gap ===
    if (style.gap.has_value()) YGNodeStyleSetGap(node, YGGutterAll, style.gap.value());
    if (style.rowGap.has_value()) YGNodeStyleSetGap(node, YGGutterRow, style.rowGap.value());

    // === Padding ===
    if (style.paddingTop.has_value()) YGNodeStyleSetPadding(node, YGEdgeTop, style.paddingTop.value());
    if (style.paddingRight.has_value()) YGNodeStyleSetPadding(node, YGEdgeRight, style.paddingRight.value());
    if (style.paddingBottom.has_value()) YGNodeStyleSetPadding(node, YGEdgeBottom, style.paddingBottom.value());
    if (style.paddingLeft.has_value()) YGNodeStyleSetPadding(node, YGEdgeLeft, style.paddingLeft.value());

    // === Margin ===
    if (style.marginTop.has_value()) YGNodeStyleSetMargin(node, YGEdgeTop, style.marginTop.value());
    if (style.marginRight.has_value()) YGNodeStyleSetMargin(node, YGEdgeRight, style.marginRight.value());
    if (style.marginBottom.has_value()) YGNodeStyleSetMargin(node, YGEdgeBottom, style.marginBottom.value());
    if (style.marginLeft.has_value()) YGNodeStyleSetMargin(node, YGEdgeLeft, style.marginLeft.value());

    // === Position ===
    if (style.position.has_value()) {
      const auto& v = style.position.value();
      if (v == "absolute") YGNodeStyleSetPositionType(node, YGPositionTypeAbsolute);
      else YGNodeStyleSetPositionType(node, YGPositionTypeRelative);
    }
    if (style.top.has_value()) YGNodeStyleSetPosition(node, YGEdgeTop, style.top.value());
    if (style.left.has_value()) YGNodeStyleSetPosition(node, YGEdgeLeft, style.left.value());
    if (style.right.has_value()) YGNodeStyleSetPosition(node, YGEdgeRight, style.right.value());
    if (style.bottom.has_value()) YGNodeStyleSetPosition(node, YGEdgeBottom, style.bottom.value());
  }

  void LayoutSubsystem::removeLayoutNode(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      YGNodeRef node = static_cast<YGNodeRef>(it->second);
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
