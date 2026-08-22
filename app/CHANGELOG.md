# Changelog

Tất cả các thay đổi đáng chú ý của dự án **ClassManager Pro** sẽ được ghi lại trong tài liệu này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/), và dự án tuân thủ [Semantic Versioning](https://semver.org/).

---

## [1.1.0] - 2026-08-22

### ✨ Tính Năng Mới Thêm Vào (Added)
- **Hệ thống Tạo Bộ Câu Hỏi Bằng AI & Custom Endpoint**:
  - Hỗ trợ đa nhà cung cấp AI: Google Gemini (Miễn phí 100%), OpenAI ChatGPT (`gpt-4o-mini`), Groq Llama 3.3/3.1 (Miễn phí) và Custom OpenAI Compatible Endpoint (DeepSeek, OpenRouter, Local Ollama...).
  - **API Test Key & Auto Model Discovery (`/api/ai/test`)**: Cho phép kiểm tra trạng thái kết nối API Key và tự động dò tìm model khả dụng của từng tài khoản.
  - **Cơ chế Chống Lặp Câu Hỏi (Deduplication)**: Tự động lọc trùng lặp nội dung với cơ sở dữ liệu SQLite trước khi lưu, đảm bảo mỗi câu hỏi sinh ra luôn độc nhất.
- **Phân Loại & Quản Lý Câu Hỏi Theo Chủ Đề (Topic Management)**:
  - Thêm cột `topic` trong cơ sở dữ liệu SQLite và hỗ trợ nhãn chủ đề trên từng câu hỏi (`🎯 Đại từ xưng hô`, `🎯 Phương tiện giao thông`, `🎯 Toán Tiếng Anh`, `🎯 Khoa học Tiếng Anh`...).
  - Thêm thanh lọc nhanh theo chủ đề (Topic Pills) trên cả trang Quản lý ngân hàng câu hỏi (`/questions`) và Trung tâm trò chơi (`/game`).
  - Hỗ trợ 1-chạm chọn toàn bộ câu hỏi theo chủ đề để bắt đầu trò chơi ngay lập tức.
- **Cài Đặt Chuyên Môn & Môn Học Giảng Dạy Của Giáo Viên**:
  - Cho phép giáo viên chọn môn học chuyên trách (Tất cả Tiếng Anh, Tiếng Anh ngôn ngữ, Toán Tiếng Anh, Khoa học Tiếng Anh, hoặc Toàn bộ môn) trong trang Cài đặt (`/settings`).
  - Giao diện tự động ẩn các môn học không liên quan để tối ưu hóa không gian làm việc.

### 🛠️ Cải Tiến & Sửa Lỗi (Fixed & Changed)
- **Tối Giản Giao Diện & Sửa Lỗi Trùng Icon**:
  - Loại bỏ các emoji trùng lặp trong Sidebar (`Gọi trả bài`, `Màn chiếu TV`, `Quét Mobile`), giữ lại icon SVG vector đồng nhất.
  - Dọn dẹp các import icon thừa và biến không dùng trong toàn bộ codebase.
- **Khắc phục lỗi Sinh câu hỏi Offline**: Mở rộng ngân hàng câu hỏi mẫu offline với chủ đề Phương tiện giao thông (Vehicles), Động vật (Animals), Đại từ xưng hô (Pronouns) và loại bỏ hoàn toàn các câu hỏi bị lặp.
- **Popup Xác Nhận Nguy Hiểm & An Toàn Dữ Liệu**:
  - Tất cả các thao tác xoá (câu hỏi, học sinh, lớp học) đều được bảo vệ bởi `ConfirmDialog`.
  - Toàn bộ thao tác cập nhật câu hỏi đều bảo toàn cấu trúc dữ liệu liên kết (`topic`, `options`, `correct_answer`).

---

## [1.0.0] - 2026-08-20
- Phiên bản phát hành đầu tiên: Quản lý lớp học, học sinh, điểm danh thẻ màu, Game Launcher 1v1 / Tổ vs Tổ / Toàn lớp / Đánh Boss và Quét camera thời gian thực.
