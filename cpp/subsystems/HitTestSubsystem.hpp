#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include "../core/Node.hpp"
#include "../strategies/QuadTree.hpp"

namespace margelo::nitro::skiakit {

  class HitTestSubsystem {
  public:
    HitTestSubsystem();

    void registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior);
    void updateWidgetLayout(const std::string& id, double x, double y, double w, double h);
    void unregisterWidget(const std::string& id);
    void setWidgetDynamic(const std::string& id, bool isDynamic);

    void registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal);
    void updateScrollOffset(const std::string& id, double offset);
    std::vector<std::string> hitTest(double x, double y);
    void clear();

  private:
    QuadTree _staticTree;
    std::vector<WidgetNode> _dynamicNodes;
    
    // Lưu thông tin gốc của widget để dễ xoá/chèn lại
    std::unordered_map<std::string, WidgetNode> _allWidgets;
    std::unordered_map<std::string, bool> _dynamicStatusMap;
    
    std::unordered_map<std::string, ScrollArea> _scrollAreas;
  };

}
