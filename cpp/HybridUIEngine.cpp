#include "HybridUIEngine.hpp"

namespace margelo::nitro::skiakit {

  void HybridUIEngine::registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) {
    _hitTestSubsystem.registerWidget(id, x, y, w, h, zIndex, behavior);
  }

  void HybridUIEngine::unregisterWidget(const std::string& id) {
    _hitTestSubsystem.unregisterWidget(id);
  }

  void HybridUIEngine::setWidgetDynamic(const std::string& id, bool isDynamic) {
    _hitTestSubsystem.setWidgetDynamic(id, isDynamic);
  }

  void HybridUIEngine::registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) {
    _hitTestSubsystem.registerScrollArea(id, x, y, w, h, horizontal);
  }

  void HybridUIEngine::unregisterScrollArea(const std::string& id) {
    _hitTestSubsystem.unregisterScrollArea(id);
  }

  void HybridUIEngine::updateScrollOffset(const std::string& id, double offset) {
    _hitTestSubsystem.updateScrollOffset(id, offset);
  }

  std::vector<NativeHitResult> HybridUIEngine::hitTest(double x, double y) {
    return _hitTestSubsystem.hitTest(x, y);
  }

  void HybridUIEngine::clear() {
    _hitTestSubsystem.clear();
    _layoutSubsystem.clear();
  }

  // ================= YOGA LAYOUT ================= //

  void HybridUIEngine::updateLayoutNode(const std::string& id, const NativeYogaStyle& style) {
    _layoutSubsystem.updateLayoutNode(id, style);
  }

  void HybridUIEngine::removeLayoutNode(const std::string& id) {
    _layoutSubsystem.removeLayoutNode(id);
  }

  void HybridUIEngine::setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds) {
    _layoutSubsystem.setChildren(parentId, childrenIds);
  }

  void HybridUIEngine::calculateLayout(const std::string& rootId, double width, double height) {
    _layoutSubsystem.calculateLayout(rootId, width, height);

    // AUTO-BRIDGE: Đồng bộ toạ độ từ Layout sang HitTest ngay lập tức
    auto allLayouts = _layoutSubsystem.getAllLayouts();
    for (const auto& pair : allLayouts) {
      const auto& id = pair.first;
      const auto& rect = pair.second;
      _hitTestSubsystem.updateWidgetLayout(id, rect.x, rect.y, rect.width, rect.height);
    }
  }

  NativeLayoutRect HybridUIEngine::getNodeLayout(const std::string& id) {
    return _layoutSubsystem.getNodeLayout(id);
  }

  std::unordered_map<std::string, NativeLayoutRect> HybridUIEngine::getAllLayouts() {
    return _layoutSubsystem.getAllLayouts();
  }

}
