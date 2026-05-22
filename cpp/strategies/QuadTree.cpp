#include "QuadTree.hpp"

namespace margelo::nitro::skiakit {

  QuadTree::QuadTree(AABB boundary, int capacity, int maxDepth, int depth)
    : _boundary(boundary), _capacity(capacity), _maxDepth(maxDepth), _depth(depth), _divided(false) {
    _nodes.reserve(capacity);
  }

  QuadTree::~QuadTree() {
    clear();
  }

  void QuadTree::clear() {
    _nodes.clear();
    if (_divided) {
      _nw->clear();
      _ne->clear();
      _sw->clear();
      _se->clear();
      _nw.reset();
      _ne.reset();
      _sw.reset();
      _se.reset();
      _divided = false;
    }
  }

  void QuadTree::subdivide() {
    double x = _boundary.x;
    double y = _boundary.y;
    double w = _boundary.w / 2.0;
    double h = _boundary.h / 2.0;

    _nw = std::make_unique<QuadTree>(AABB{x, y, w, h}, _capacity, _maxDepth, _depth + 1);
    _ne = std::make_unique<QuadTree>(AABB{x + w, y, w, h}, _capacity, _maxDepth, _depth + 1);
    _sw = std::make_unique<QuadTree>(AABB{x, y + h, w, h}, _capacity, _maxDepth, _depth + 1);
    _se = std::make_unique<QuadTree>(AABB{x + w, y + h, w, h}, _capacity, _maxDepth, _depth + 1);

    _divided = true;
  }

  bool QuadTree::insert(const WidgetNode& node) {
    // 1. Check if the node intersects this QuadTree node's boundary at all
    if (node.x + node.w < _boundary.x || node.x > _boundary.x + _boundary.w ||
        node.y + node.h < _boundary.y || node.y > _boundary.y + _boundary.h) {
      return false; // Not in boundary
    }

    // 2. Subdivide if we reached capacity
    if (!_divided && _nodes.size() >= _capacity && _depth < _maxDepth) {
      subdivide();
    }

    // 3. If divided, try to push the node down to a child 
    // ONLY if it completely fits inside that child.
    if (_divided) {
      double midX = _boundary.x + _boundary.w / 2.0;
      double midY = _boundary.y + _boundary.h / 2.0;

      bool fitsTop = (node.y + node.h <= midY);
      bool fitsBottom = (node.y >= midY);
      bool fitsLeft = (node.x + node.w <= midX);
      bool fitsRight = (node.x >= midX);

      if (fitsTop && fitsLeft) return _nw->insert(node);
      if (fitsTop && fitsRight) return _ne->insert(node);
      if (fitsBottom && fitsLeft) return _sw->insert(node);
      if (fitsBottom && fitsRight) return _se->insert(node);
      
      // If it doesn't completely fit in any single child (i.e. crosses boundaries),
      // we MUST keep it in this parent node.
    }

    // 4. Store in current node
    _nodes.push_back(node);
    return true;
  }

  bool QuadTree::remove(const std::string& id) {
    for (auto it = _nodes.begin(); it != _nodes.end(); ++it) {
      if (it->id == id) {
        _nodes.erase(it);
        return true;
      }
    }

    if (_divided) {
      if (_nw->remove(id)) return true;
      if (_ne->remove(id)) return true;
      if (_sw->remove(id)) return true;
      if (_se->remove(id)) return true;
    }

    return false;
  }

  void QuadTree::query(const AABB& range, std::vector<WidgetNode>& found) const {
    if (!_boundary.intersects(range)) {
      return;
    }

    for (const auto& node : _nodes) {
      if (range.contains(node)) { // Adjust this if you want partial intersections
        found.push_back(node);
      }
    }

    if (_divided) {
      _nw->query(range, found);
      _ne->query(range, found);
      _sw->query(range, found);
      _se->query(range, found);
    }
  }

  void QuadTree::hitTest(double x, double y, std::vector<WidgetNode>& found) const {
    if (x < _boundary.x || x > _boundary.x + _boundary.w ||
        y < _boundary.y || y > _boundary.y + _boundary.h) {
      return;
    }

    for (const auto& node : _nodes) {
      if (x >= node.x && x <= node.x + node.w &&
          y >= node.y && y <= node.y + node.h) {
        found.push_back(node);
      }
    }

    if (_divided) {
      _nw->hitTest(x, y, found);
      _ne->hitTest(x, y, found);
      _sw->hitTest(x, y, found);
      _se->hitTest(x, y, found);
    }
  }

}
