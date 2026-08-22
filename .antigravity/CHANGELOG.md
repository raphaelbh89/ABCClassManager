# Lịch sử Cập nhật (Changelog)

Tất cả các thay đổi đáng chú ý của dự án này sẽ được ghi lại trong file này.
Format dựa trên tiêu chuẩn [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/).

## [1.0.0] - 2026-08-22
### Added (Đã thêm)
- **Phase 0: Nền tảng**: Khởi tạo Next.js 16 App Router, Tailwind CSS v4, hệ thống biến giao diện tươi sáng `global.css` (màu pastel học đường, font Nunito & Baloo 2), cấu hình Supabase Client/Server/Middleware, Schema PostgreSQL 10 bảng với đầy đủ PK/FK/RLS.
- **Phase 1: Quản lý lớp & học sinh**: CRUD Lớp học kèm Room code, CRUD Học sinh với nhân vật RPG Emoji đa sắc màu, Sơ đồ lớp kéo-thả `@dnd-kit` hoán đổi chỗ ngồi thông minh.
- **Phase 2: Điểm danh bằng ảnh**: Thuật toán Brightness Variance phân tích độ hiện diện theo ô ghế (Seat-based presence detection), Camera PWA chụp ảnh lớp, Màn hình xác nhận thủ công bắt buộc, Lưu trữ lịch sử điểm danh 30 ngày.
- **Phase 3: Nhân vật RPG & Đánh giá**: Biểu đồ Radar Stats RPG (Recharts), Hệ thống mở khóa huy hiệu tự động, Quick Action FAB chấm điểm tại chỗ < 3 giây không rời luồng lớp học.
- **Phase 4: Đồng bộ Real-time 2 thiết bị**: Kênh Supabase Broadcast Realtime qua Room Code, Màn chiếu TV Full HD (Display Mode) với pháo hoa confetti và bảng vinh danh, Bộ điều khiển điện thoại (Scanner Mode).
- **Phase 5: Ngân hàng câu hỏi & Game Launcher**: CRUD ngân hàng câu hỏi phân loại theo môn học (Toán, Tiếng Việt, TN&XH...), Auto-seed câu hỏi mẫu, Game Launcher 1-click kích hoạt đồng thời TV và Mobile.
- **Phase 6: Quét Camera Thẻ Màu Live**: Thuật toán Client-side HSV Color Space phân loại 4 màu thẻ (Đỏ, Xanh lá, Vàng, Xanh dương), Camera live quét 3s, Bảng nút +/- tinh chỉnh số lượng thẻ trước khi phát lên TV.
- **Phase 7: Xuất báo cáo & Cài đặt**: Xuất danh sách học sinh và lịch sử điểm danh ra file Excel (.xlsx), Xuất phiếu tổng kết ra file PDF (.pdf), Chế độ ngày yên tĩnh (Quiet Mode), Hiệu chỉnh độ nhạy camera.

## [0.1.0.1] - 2026-08-08 (Mẫu tham khảo cho AI)
### Fixed (Đã sửa)
- Sửa lỗi nút Button bị lệch margin trong file `Button.tsx`.
- Sửa lỗi crash app khi nhập thiếu trường dữ liệu trong form Đăng ký.