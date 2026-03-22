# Phase 12: Global Context & Provider

## Checklist
- [x] Tạo context/provider cho theme, localization, media query
- [x] Đảm bảo đồng bộ theme, đa ngôn ngữ, responsive UI
- [x] Tích hợp context vào toàn bộ UI kit

## Steps
1. Tạo ThemeContext, LocalizationContext, MediaQueryContext
2. Cung cấp context từ root (CanvasRoot)
3. Các component nhận context qua useContext hoặc hook
4. Khi đổi theme/language, update context, các component tự re-render

## Thuật toán/Logic
- Dùng React Context để quản lý theme, localization, media query
- Khi đổi theme/language, update context, đồng bộ toàn bộ UI
- MediaQueryContext giúp responsive UI theo kích thước màn hình

 ## Đề xuất
 Nên tạo ThemeContext, LocalizationContext, MediaQueryContext ở cấp root (CanvasRoot) và truyền xuống toàn bộ UI kit. Khi đổi theme/language, update context, các component tự re-render. Xem chi tiết hướng dẫn tại [store-design/special-cases.md](store-design/special-cases.md) nếu cần tích hợp thêm logic context.

## Định hướng
- Đảm bảo UI kit đồng bộ theme, đa ngôn ngữ, responsive
- Dễ mở rộng cho các context khác (auth, settings)
- Tích hợp với store, component base
