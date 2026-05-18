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
    // If the node doesn't completely fit in this quad, we still insert it if it intersects.
    // For simplicity, we just check if the center of the node is within the boundary.
    double cx = node.x + node.w / 2.0;
    double cy = node.y + node.h / 2.0;
    
    if (cx < _boundary.x || cx > _boundary.x + _boundary.w ||
        cy < _boundary.y || cy > _boundary.y + _boundary.h) {
      return false; // Center not in boundary
    }

    if (_nodes.size() < _capacity || _depth >= _maxDepth) {
      _nodes.push_back(node);
      return true;
    }

    if (!_divided) {
      subdivide();
    }

    if (_nw->insert(node)) return true;
    if (_ne->insert(node)) return true;
    if (_sw->insert(node)) return true;
    if (_se->insert(node)) return true;

    // Fallback: put it in this node if subdivision fails
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
