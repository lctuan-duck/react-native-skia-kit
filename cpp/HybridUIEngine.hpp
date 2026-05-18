#pragma once

#include "HybridUIEngineSpec.hpp"
#include "subsystems/HitTestSubsystem.hpp"
#include "subsystems/LayoutSubsystem.hpp"

namespace margelo::nitro::skiakit {

  class HybridUIEngine : public HybridUIEngineSpec {
  public:
    HybridUIEngine() : HybridObject(TAG) {}
    ~HybridUIEngine() override = default;

    // Hit-Test Subsystem
    void registerWidget(const std::string& id, double x, double y, double w, double h, double zIndex, double behavior) override;
    void unregisterWidget(const std::string& id) override;
    void setWidgetDynamic(const std::string& id, bool isDynamic) override;
    void registerScrollArea(const std::string& id, double x, double y, double w, double h, bool horizontal) override;
    void updateScrollOffset(const std::string& id, double offset) override;
    std::vector<NativeHitResult> hitTest(double x, double y) override;
    void clear() override;

    // Layout Subsystem
    void updateLayoutNode(const std::string& id, const NativeYogaStyle& style) override;
    void removeLayoutNode(const std::string& id) override;
    void setChildren(const std::string& parentId, const std::vector<std::string>& childrenIds) override;
    void calculateLayout(const std::string& rootId, double width, double height) override;
    NativeLayoutRect getNodeLayout(const std::string& id) override;
    std::unordered_map<std::string, NativeLayoutRect> getAllLayouts() override;

  private:
    HitTestSubsystem _hitTestSubsystem;
    LayoutSubsystem _layoutSubsystem;
  };

}
