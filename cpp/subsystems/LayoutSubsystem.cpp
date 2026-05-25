#include "LayoutSubsystem.hpp"
#include <yoga/Yoga.h>
#include <android/log.h>

namespace margelo::nitro::skiakit {

  YGSize LayoutSubsystem::globalYogaMeasureFunc(
      YGNodeConstRef node,
      float width, YGMeasureMode widthMode,
      float height, YGMeasureMode heightMode)
  {
    auto* data = static_cast<LayoutSubsystem::NodeData*>(YGNodeGetContext(const_cast<YGNodeRef>(node)));
    if (data && data->system && data->system->_measureCb) {
      YGSize res = data->system->_measureCb(data->id, width, static_cast<int>(widthMode), height, static_cast<int>(heightMode));
      __android_log_print(ANDROID_LOG_DEBUG, "SkiaKit", "globalYogaMeasureFunc id=%s w=%.1f h=%.1f -> res.w=%.1f res.h=%.1f", data->id.c_str(), width, height, res.width, res.height);
      return res;
    }
    __android_log_print(ANDROID_LOG_WARN, "SkiaKit", "globalYogaMeasureFunc FAILED for unknown node");
    return {0, 0};
  }

  void* LayoutSubsystem::getOrCreateYogaNode(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      return it->second->node;
    }
    YGNodeRef node = YGNodeNew();
    auto data = std::make_unique<NodeData>();
    data->id = id;
    data->node = node;
    data->system = this;
    YGNodeSetContext(node, data.get());
    _yogaNodes[id] = std::move(data);
    return node;
  }

  LayoutSubsystem::~LayoutSubsystem() {
    clear();
  }

  void LayoutSubsystem::updateLayoutNode(const std::string& id, const NativeYogaStyle& style) {
    YGNodeRef node = static_cast<YGNodeRef>(getOrCreateYogaNode(id));

    auto applyDim = [node](const std::optional<std::variant<std::string, double>>& val, auto setPt, auto setPct, auto setAuto) {
      if (!val.has_value()) return;
      if (std::holds_alternative<double>(val.value())) {
        setPt(node, std::get<double>(val.value()));
      } else {
        std::string s = std::get<std::string>(val.value());
        if (s == "auto") {
          setAuto(node);
        } else if (!s.empty() && s.back() == '%') {
          try {
            float pct = std::stof(s.substr(0, s.length() - 1));
            setPct(node, pct);
          } catch(...) {}
        }
      }
    };

    auto applyEdge = [node](const std::optional<std::variant<std::string, double>>& val, YGEdge edge, auto setPt, auto setPct) {
      if (!val.has_value()) return;
      if (std::holds_alternative<double>(val.value())) {
        setPt(node, edge, std::get<double>(val.value()));
      } else {
        std::string s = std::get<std::string>(val.value());
        if (!s.empty() && s.back() == '%') {
          try {
            float pct = std::stof(s.substr(0, s.length() - 1));
            setPct(node, edge, pct);
          } catch(...) {}
        }
      }
    };

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

    // === Align Content ===
    if (style.alignContent.has_value()) {
      const auto& v = style.alignContent.value();
      if (v == "center") YGNodeStyleSetAlignContent(node, YGAlignCenter);
      else if (v == "flex-end" || v == "end") YGNodeStyleSetAlignContent(node, YGAlignFlexEnd);
      else if (v == "stretch") YGNodeStyleSetAlignContent(node, YGAlignStretch);
      else if (v == "baseline") YGNodeStyleSetAlignContent(node, YGAlignBaseline);
      else if (v == "space-between" || v == "spaceBetween") YGNodeStyleSetAlignContent(node, YGAlignSpaceBetween);
      else if (v == "space-around" || v == "spaceAround") YGNodeStyleSetAlignContent(node, YGAlignSpaceAround);
      else YGNodeStyleSetAlignContent(node, YGAlignFlexStart);
    }

    // === Flex Wrap ===
    if (style.flexWrap.has_value()) {
      const auto& v = style.flexWrap.value();
      if (v == "wrap") YGNodeStyleSetFlexWrap(node, YGWrapWrap);
      else if (v == "wrap-reverse") YGNodeStyleSetFlexWrap(node, YGWrapWrapReverse);
      else YGNodeStyleSetFlexWrap(node, YGWrapNoWrap);
    }

    // === Dimensions ===
    applyDim(style.width, YGNodeStyleSetWidth, YGNodeStyleSetWidthPercent, YGNodeStyleSetWidthAuto);
    applyDim(style.height, YGNodeStyleSetHeight, YGNodeStyleSetHeightPercent, YGNodeStyleSetHeightAuto);
    applyDim(style.minWidth, YGNodeStyleSetMinWidth, YGNodeStyleSetMinWidthPercent, [](YGNodeRef){});
    applyDim(style.maxWidth, YGNodeStyleSetMaxWidth, YGNodeStyleSetMaxWidthPercent, [](YGNodeRef){});
    applyDim(style.minHeight, YGNodeStyleSetMinHeight, YGNodeStyleSetMinHeightPercent, [](YGNodeRef){});
    applyDim(style.maxHeight, YGNodeStyleSetMaxHeight, YGNodeStyleSetMaxHeightPercent, [](YGNodeRef){});
    if (style.aspectRatio.has_value()) YGNodeStyleSetAspectRatio(node, style.aspectRatio.value());

    // === Layout Rules ===
    if (style.display.has_value()) {
      const auto& v = style.display.value();
      if (v == "none") YGNodeStyleSetDisplay(node, YGDisplayNone);
      else YGNodeStyleSetDisplay(node, YGDisplayFlex);
    }
    
    if (style.overflow.has_value()) {
      const auto& v = style.overflow.value();
      if (v == "hidden") YGNodeStyleSetOverflow(node, YGOverflowHidden);
      else if (v == "scroll") YGNodeStyleSetOverflow(node, YGOverflowScroll);
      else YGNodeStyleSetOverflow(node, YGOverflowVisible);
    }

    if (style.direction.has_value()) {
      const auto& v = style.direction.value();
      if (v == "rtl") YGNodeStyleSetDirection(node, YGDirectionRTL);
      else if (v == "ltr") YGNodeStyleSetDirection(node, YGDirectionLTR);
      else YGNodeStyleSetDirection(node, YGDirectionInherit);
    }

    // === Flex Child ===
    if (style.flex.has_value()) YGNodeStyleSetFlex(node, style.flex.value());
    if (style.flexGrow.has_value()) YGNodeStyleSetFlexGrow(node, style.flexGrow.value());
    if (style.flexShrink.has_value()) YGNodeStyleSetFlexShrink(node, style.flexShrink.value());
    applyDim(style.flexBasis, YGNodeStyleSetFlexBasis, YGNodeStyleSetFlexBasisPercent, YGNodeStyleSetFlexBasisAuto);

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
    if (style.columnGap.has_value()) YGNodeStyleSetGap(node, YGGutterColumn, style.columnGap.value());

    // === Padding ===
    applyEdge(style.paddingTop, YGEdgeTop, YGNodeStyleSetPadding, YGNodeStyleSetPaddingPercent);
    applyEdge(style.paddingRight, YGEdgeRight, YGNodeStyleSetPadding, YGNodeStyleSetPaddingPercent);
    applyEdge(style.paddingBottom, YGEdgeBottom, YGNodeStyleSetPadding, YGNodeStyleSetPaddingPercent);
    applyEdge(style.paddingLeft, YGEdgeLeft, YGNodeStyleSetPadding, YGNodeStyleSetPaddingPercent);

    // === Margin ===
    applyEdge(style.marginTop, YGEdgeTop, YGNodeStyleSetMargin, YGNodeStyleSetMarginPercent);
    applyEdge(style.marginRight, YGEdgeRight, YGNodeStyleSetMargin, YGNodeStyleSetMarginPercent);
    applyEdge(style.marginBottom, YGEdgeBottom, YGNodeStyleSetMargin, YGNodeStyleSetMarginPercent);
    applyEdge(style.marginLeft, YGEdgeLeft, YGNodeStyleSetMargin, YGNodeStyleSetMarginPercent);

    // === Position ===
    if (style.position.has_value()) {
      const auto& v = style.position.value();
      if (v == "absolute") YGNodeStyleSetPositionType(node, YGPositionTypeAbsolute);
      else YGNodeStyleSetPositionType(node, YGPositionTypeRelative);
    }
    applyEdge(style.top, YGEdgeTop, YGNodeStyleSetPosition, YGNodeStyleSetPositionPercent);
    applyEdge(style.left, YGEdgeLeft, YGNodeStyleSetPosition, YGNodeStyleSetPositionPercent);
    applyEdge(style.right, YGEdgeRight, YGNodeStyleSetPosition, YGNodeStyleSetPositionPercent);
    applyEdge(style.bottom, YGEdgeBottom, YGNodeStyleSetPosition, YGNodeStyleSetPositionPercent);
  }

  void LayoutSubsystem::removeLayoutNode(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      YGNodeRef node = static_cast<YGNodeRef>(it->second->node);
      YGNodeRef parent = YGNodeGetParent(node);
      if (parent) {
        YGNodeRemoveChild(parent, node);
      }
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

  void LayoutSubsystem::addChild(const std::string& parentId, const std::string& childId) {
    YGNodeRef parent = static_cast<YGNodeRef>(getOrCreateYogaNode(parentId));
    YGNodeRef child = static_cast<YGNodeRef>(getOrCreateYogaNode(childId));
    // Remove from old parent first (Yoga requires unique parent)
    YGNodeRef oldParent = YGNodeGetParent(child);
    if (oldParent) {
      YGNodeRemoveChild(oldParent, child);
    }
    uint32_t count = YGNodeGetChildCount(parent);
    YGNodeInsertChild(parent, child, count);
  }

  void LayoutSubsystem::insertChildBefore(const std::string& parentId, const std::string& childId, const std::string& beforeChildId) {
    YGNodeRef parent = static_cast<YGNodeRef>(getOrCreateYogaNode(parentId));
    YGNodeRef child = static_cast<YGNodeRef>(getOrCreateYogaNode(childId));
    
    YGNodeRef oldParent = YGNodeGetParent(child);
    if (oldParent) {
      YGNodeRemoveChild(oldParent, child);
    }

    uint32_t count = YGNodeGetChildCount(parent);
    uint32_t index = count;
    
    auto itBefore = _yogaNodes.find(beforeChildId);
    if (itBefore != _yogaNodes.end()) {
      YGNodeRef beforeChild = static_cast<YGNodeRef>(itBefore->second->node);
      for (uint32_t i = 0; i < count; i++) {
        if (YGNodeGetChild(parent, i) == beforeChild) {
          index = i;
          break;
        }
      }
    }
    
    YGNodeInsertChild(parent, child, index);
  }

  void LayoutSubsystem::removeChild(const std::string& parentId, const std::string& childId) {
    auto pit = _yogaNodes.find(parentId);
    auto cit = _yogaNodes.find(childId);
    if (pit == _yogaNodes.end() || cit == _yogaNodes.end()) return;
    YGNodeRef parent = static_cast<YGNodeRef>(pit->second->node);
    YGNodeRef child = static_cast<YGNodeRef>(cit->second->node);
    YGNodeRemoveChild(parent, child);
  }

  void LayoutSubsystem::calculateLayout(const std::string& rootId, double width, double height) {
    auto it = _yogaNodes.find(rootId);
    if (it != _yogaNodes.end()) {
      YGNodeRef root = static_cast<YGNodeRef>(it->second->node);
      float availableWidth = width >= 0 ? (float)width : YGUndefined;
      float availableHeight = height >= 0 ? (float)height : YGUndefined;
      __android_log_print(ANDROID_LOG_DEBUG, "SkiaKit", "calculateLayout root=%s availW=%.1f availH=%.1f", rootId.c_str(), availableWidth, availableHeight);
      YGNodeCalculateLayout(root, availableWidth, availableHeight, YGDirectionLTR);
    }
  }

  void LayoutSubsystem::markDirty(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      YGNodeRef node = static_cast<YGNodeRef>(it->second->node);
      if (!YGNodeHasMeasureFunc(node)) {
        YGNodeSetMeasureFunc(node, &globalYogaMeasureFunc);
      }
      YGNodeMarkDirty(node);
    }
  }

  static float getAbsoluteLeft(YGNodeRef node) {
    float left = YGNodeLayoutGetLeft(node);
    YGNodeRef parent = YGNodeGetParent(node);
    while (parent != nullptr) {
      left += YGNodeLayoutGetLeft(parent);
      parent = YGNodeGetParent(parent);
    }
    return left;
  }

  static float getAbsoluteTop(YGNodeRef node) {
    float top = YGNodeLayoutGetTop(node);
    YGNodeRef parent = YGNodeGetParent(node);
    while (parent != nullptr) {
      top += YGNodeLayoutGetTop(parent);
      parent = YGNodeGetParent(parent);
    }
    return top;
  }

  NativeLayoutRect LayoutSubsystem::getNodeLayout(const std::string& id) {
    auto it = _yogaNodes.find(id);
    if (it != _yogaNodes.end()) {
      YGNodeRef node = static_cast<YGNodeRef>(it->second->node);
      return NativeLayoutRect(
        (double)getAbsoluteLeft(node),
        (double)getAbsoluteTop(node),
        (double)YGNodeLayoutGetWidth(node),
        (double)YGNodeLayoutGetHeight(node)
      );
    }
    return NativeLayoutRect(0, 0, 0, 0);
  }

  std::unordered_map<std::string, NativeLayoutRect> LayoutSubsystem::getAllLayouts() {
    std::unordered_map<std::string, NativeLayoutRect> result;
    for (const auto& pair : _yogaNodes) {
      YGNodeRef node = static_cast<YGNodeRef>(pair.second->node);
      result[pair.first] = NativeLayoutRect(
        (double)getAbsoluteLeft(node),
        (double)getAbsoluteTop(node),
        (double)YGNodeLayoutGetWidth(node),
        (double)YGNodeLayoutGetHeight(node)
      );
    }
    return result;
  }

  std::unordered_map<std::string, NativeLayoutRect> LayoutSubsystem::getAllRelativeLayouts() {
    std::unordered_map<std::string, NativeLayoutRect> result;
    for (const auto& pair : _yogaNodes) {
      YGNodeRef node = static_cast<YGNodeRef>(pair.second->node);
      result[pair.first] = NativeLayoutRect(
        (double)YGNodeLayoutGetLeft(node),
        (double)YGNodeLayoutGetTop(node),
        (double)YGNodeLayoutGetWidth(node),
        (double)YGNodeLayoutGetHeight(node)
      );
    }
    return result;
  }

  void LayoutSubsystem::clear() {
    for (auto& pair : _yogaNodes) {
      YGNodeFree(static_cast<YGNodeRef>(pair.second->node));
    }
    _yogaNodes.clear();
  }

}
