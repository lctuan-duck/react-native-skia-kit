#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <functional>
#include <memory>
#include <yoga/Yoga.h>
#include "NativeLayoutRect.hpp"
#include "NativeYogaStyle.hpp"

namespace margelo::nitro::skiakit {

  class LayoutSubsystem {
  public:
    ~LayoutSubsystem();
    
    void updateLayoutNode(const std::string& id, const NativeYogaStyle& style);
    void removeLayoutNode(const std::string& id);
    void setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds);
    void addChild(const std::string& parentId, const std::string& childId);
    void removeChild(const std::string& parentId, const std::string& childId);
    void calculateLayout(const std::string& rootId, double width, double height);
    NativeLayoutRect getNodeLayout(const std::string& id);
    std::unordered_map<std::string, NativeLayoutRect> getAllLayouts();
    std::unordered_map<std::string, NativeLayoutRect> getAllRelativeLayouts();
    void clear();

    using MeasureCallback = std::function<YGSize(const std::string& id, float width, int widthMode, float height, int heightMode)>;
    void setMeasureCallback(MeasureCallback cb) { _measureCb = std::move(cb); }
    void markDirty(const std::string& id);

    struct NodeData {
      std::string id;
      void* node;
      LayoutSubsystem* system;
    };
    MeasureCallback _measureCb;

    static YGSize globalYogaMeasureFunc(
        YGNodeConstRef node,
        float width, YGMeasureMode widthMode,
        float height, YGMeasureMode heightMode);

  private:
    std::unordered_map<std::string, std::unique_ptr<NodeData>> _yogaNodes;
    void* getOrCreateYogaNode(const std::string& id);
  };

}
