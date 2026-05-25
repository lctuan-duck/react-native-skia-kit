#pragma once

#include <string>

namespace margelo::nitro::skiakit {

  struct WidgetNode {
    std::string id;
    double x;
    double y;
    double w;
    double h;
    double zIndex;
    double behavior; // 1 = opaque, 0 = translucent
    uint64_t order;  // Insertion order to resolve DOM depth when zIndex is equal
    std::string pointerEvents = "auto"; // Thêm dòng này
  };

  struct ScrollArea {
    std::string id;
    double x;
    double y;
    double w;
    double h;
    double offset;
    bool horizontal;
  };

}
