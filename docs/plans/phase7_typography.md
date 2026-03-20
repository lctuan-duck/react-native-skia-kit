# Phase 7: Typography Engine (Text Rendering)

## Checklist
- [ ] Nhúng font .ttf vào assets, không dùng font hệ thống
- [ ] Sử dụng Skia's SkParagraph để xử lý word wrap, căn lề, đo kích thước chữ
- [ ] Đảm bảo đồng nhất UI trên Android/iOS

## Steps
1. Thêm file font .ttf vào thư mục assets
2. Load font trước khi render text
3. Sử dụng SkParagraph để vẽ text, tự động xuống dòng và căn lề
4. Đo kích thước text để báo lại cho Yoga Node

## Thuật toán/Logic
- Khi nhận props text, font, width, style:
	1. Load font .ttf (nếu chưa có)
	2. Tạo SkParagraph với text, font, style
	3. Đo kích thước text bằng SkParagraph.measure(width)
	4. Nếu text thay đổi, cập nhật lại kích thước cho Yoga Node (setWidth, setHeight)
	5. Nếu font không load được, dùng font fallback
	6. Tự động xuống dòng, căn lề (align) theo props
- Đảm bảo đồng nhất UI trên Android/iOS bằng cách luôn dùng font nhúng và đo kích thước trước khi layout
- Khi render, vẽ text tại vị trí layout đã tính toán

## Nguồn tham khảo
- [Skia Paragraph API](https://skia.org/docs/user/modules/skparagraph)
- [Flutter Typography](https://docs.flutter.dev/development/ui/widgets/text)
- [Libtxt (Flutter's Text Engine)](https://github.com/flutter/engine/tree/master/libtxt)
