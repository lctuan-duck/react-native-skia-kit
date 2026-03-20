## Lưu trữ dữ liệu render/layout với Zustand + Immer
- Khi render, lấy dữ liệu layout từ layoutMap bằng Zustand selector.
- Dùng Immer middleware để tránh copy toàn bộ Map.
- Chi tiết xem tại [layout-store.md](../store-design/layout-store.md).

# Phase 5: Render Engine (Skia Canvas)

## Checklist
- [ ] Chuyển kết quả layout thành lệnh vẽ Skia (canvas.drawRect, canvas.drawText...)
- [ ] Đảm bảo render đồng nhất trên Android/iOS
- [ ] Hỗ trợ vẽ Box, Text, Image
- [ ] Triển khai smart re-render (React.memo + Zustand selector + useDerivedValue)

## Steps
1. Nhận map layout từ Layout Engine (layoutMap chứa left, top, width, height cho từng widget)
2. Khi code, bạn vẫn gọi component như React/JSX:
	 ```jsx
	 <Box flex={1} color="blue">
		 <Text width={100} height={40}>Hello</Text>
	 </Box>
	 ```
3. Duyệt qua cây component, lấy id/key của từng widget để truy xuất layout từ layoutMap
4. Truyền layout (left, top, width, height) vào props của component Skia:
	 ```jsx
	 <SkiaBox left={layout.left} top={layout.top} width={layout.width} height={layout.height} color={color} />
	 ```
5. Gọi lệnh vẽ Skia tương ứng (drawRect, drawText, drawImage) bên trong component Skia
6. Đảm bảo render đúng vị trí, đúng kích thước, đồng nhất trên Android/iOS

## Smart Re-render (3 tầng)
Tương đương `markNeedsPaint()` của Flutter, Skia Kit dùng 3 tầng kiểm soát re-render:

### Tầng 1: Zustand Selector
```ts
// Chỉ re-render khi layout CỦA WIDGET NÀY thay đổi (không phải toàn bộ layoutMap)
const layout = useLayoutStore((state) => state.layoutMap.get(widgetId));
```

### Tầng 2: React.memo
```ts
export const SkiaBox = React.memo(function SkiaBox(props) {
  const layout = useLayoutStore((state) => state.layoutMap.get(props.widgetId));
  if (!layout) return null;
  return <Rect x={layout.x} y={layout.y} width={layout.width} height={layout.height} color={props.color} />;
}, (prev, next) => {
  // Custom compare: chỉ so sánh props ảnh hưởng render
  return prev.color === next.color
    && prev.widgetId === next.widgetId
    && prev.borderRadius === next.borderRadius;
});
```

### Tầng 3: useDerivedValue cho Animation
```ts
// Chỉ re-render Skia canvas khi animated value thay đổi
const derivedOpacity = useDerivedValue(() => opacity.value);
```

## Quy trình tổng quát
- Khi render, mỗi component sẽ nhận layout từ layoutMap (được tính ở phase trước)
- Component Skia sẽ vẽ UI tại vị trí và kích thước đúng theo layout
- Nếu layout thay đổi (resize, style, flex...), dirty widget được recalculate → layoutMap update → chỉ component bị ảnh hưởng re-render
- React.memo ngăn re-render không cần thiết cho component không thay đổi props

## Ví dụ code minh họa
```ts
// 1. Tính layout (chỉ cho dirty widgets)
const layoutMap = calculateLayout(widgetTree, { width: 360, height: 640 });

// 2. Render component
widgetTree.forEach(widget => {
	const layout = layoutMap[widget.id];
	renderSkiaComponent(widget, layout);
});

// 3. Component Skia nhận layout và vẽ
function renderSkiaComponent(widget, layout) {
	if (widget.type === 'Box') {
		drawRect(layout.left, layout.top, layout.width, layout.height, widget.color);
	}
	if (widget.type === 'Text') {
		drawText(layout.left, layout.top, widget.text);
	}
}
```

## Thuật toán/Logic
- Render pass: Duyệt qua tất cả widget đã có layout, vẽ lên Canvas tại vị trí đúng
- Smart re-render: React.memo + Zustand selector + useDerivedValue
- Đảm bảo không vẽ thừa, chỉ vẽ khi có thay đổi

## Nguồn tham khảo
- [React Native Skia Canvas API](https://shopify.github.io/react-native-skia/docs/canvas/)
- [Flutter Rendering Pipeline](https://docs.flutter.dev/resources/architectural-overview)
