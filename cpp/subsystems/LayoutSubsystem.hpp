#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include "NativeLayoutRect.hpp"
#include "NativeYogaStyle.hpp"

namespace margelo::nitro::skiakit {

  class LayoutSubsystem {
  public:
    ~LayoutSubsystem();
    
    void updateLayoutNode(const std::string& id, const NativeYogaStyle& style);
    void removeLayoutNode(const std::string& id);
    void setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds);
    void calculateLayout(const std::string& rootId, double width, double height);
    NativeLayoutRect getNodeLayout(const std::string& id);
    std::unordered_map<std::string, NativeLayoutRect> getAllLayouts();
    void clear();

  private:
    std::unordered_map<std::string, void*> _yogaNodes;
    void* getOrCreateYogaNode(const std::string& id);
  };

}
