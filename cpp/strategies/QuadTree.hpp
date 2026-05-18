#pragma once

#include <vector>
#include <memory>
#include <functional>
#include "../core/Node.hpp"

namespace margelo::nitro::skiakit {

  // Bounding box for QuadTree
  struct AABB {
    double x, y, w, h;
    
    bool contains(const WidgetNode& node) const {
      return node.x >= x && node.x + node.w <= x + w &&
             node.y >= y && node.y + node.h <= y + h;
    }
    
    bool intersects(const AABB& other) const {
      return !(other.x > x + w || 
               other.x + other.w < x || 
               other.y > y + h ||
               other.y + other.h < y);
    }
  };

  class QuadTree {
  public:
    QuadTree(AABB boundary, int capacity = 4, int maxDepth = 10, int depth = 0);
    ~QuadTree();

    bool insert(const WidgetNode& node);
    bool remove(const std::string& id);
    void query(const AABB& range, std::vector<WidgetNode>& found) const;
    void clear();
    
    // Tìm kiếm node chính xác tại 1 toạ độ (x, y)
    void hitTest(double x, double y, std::vector<WidgetNode>& found) const;

  private:
    AABB _boundary;
    int _capacity;
    int _maxDepth;
    int _depth;
    bool _divided;

    std::vector<WidgetNode> _nodes;

    std::unique_ptr<QuadTree> _nw;
    std::unique_ptr<QuadTree> _ne;
    std::unique_ptr<QuadTree> _sw;
    std::unique_ptr<QuadTree> _se;

    void subdivide();
  };

}
