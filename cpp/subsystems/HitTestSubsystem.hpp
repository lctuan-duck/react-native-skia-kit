#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include "../core/Node.hpp"

namespace margelo::nitro::skiakit {

  class HitTestSubsystem {
  public:
    void registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior);
    void unregisterWidget(const std::string& id);
    void registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal);
    void updateScrollOffset(const std::string& id, double offset);
    std::vector<std::string> hitTest(double x, double y);
    void clear();

  private:
    std::vector<WidgetNode> _nodes;
    std::unordered_map<std::string, size_t> _nodeIndexMap;
    std::unordered_map<std::string, ScrollArea> _scrollAreas;
  };

}
