#pragma once

#include "HybridUIEngineSpec.hpp"
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

namespace margelo::nitro::skiakit {

  struct WidgetNode {
    std::string id;
    double x, y, w, h;
    double zIndex;
    double behavior;
  };

  struct ScrollNode {
    std::string id;
    double x, y, w, h;
    double offset;
    bool horizontal;
  };

  class HybridUIEngine: public HybridUIEngineSpec {
  private:
    std::vector<WidgetNode> _nodes;
    std::unordered_map<std::string, size_t> _nodeIndexMap;
    std::unordered_map<std::string, ScrollNode> _scrollAreas;
    
    // YOGA LAYOUT
    // (Void pointers to avoid direct YGNodeRef include issues if not needed in header, but let's just use void* or forward declaration)
    std::unordered_map<std::string, void*> _yogaNodes; 
    void* getOrCreateYogaNode(const std::string& id);

  public:
    explicit HybridUIEngine(): HybridObject(TAG) { }
    ~HybridUIEngine() override;

    // HIT TESTING
    void registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) override;
    void unregisterWidget(const std::string& id) override;
    void registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) override;
    void updateScrollOffset(const std::string& id, double offset) override;
    std::vector<std::string> hitTest(double x, double y) override;
    void clear() override;

    // YOGA LAYOUT
    void updateLayoutNode(const std::string& id, const std::string& flexDirection, const std::string& justifyContent, const std::string& alignItems, const std::string& flexWrap, double width, double height, double flex, double gap, double paddingTop, double paddingRight, double paddingBottom, double paddingLeft) override;
    void setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds) override;
    void calculateLayout(const std::string& rootId, double width, double height) override;
    NativeLayoutRect getNodeLayout(const std::string& id) override;
    std::unordered_map<std::string, NativeLayoutRect> getAllLayouts() override;
  };

}
