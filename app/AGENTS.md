<!-- BEGIN:nextjs-agent-rules -->

# AGENT MANDATORY STARTUP DIRECTIVE

> ⚠️ **BẮT BUỘC ĐỐI VỚI MỌI AI AGENT KHI BẮT ĐẦU PHIÊN LÀM VIỆC**:
> Bạn **KHÔNG CẦN ĐỌC LẠI TOÀN BỘ CODEBASE**. 
> Hãy đọc ngay 2 file tài liệu nền tảng sau trước khi trả lời hoặc thực hiện bất kỳ lệnh nào:
> 1. [`PROJECT_DOCUMENTATION.md`](file:///d:/ClassManagers/app/PROJECT_DOCUMENTATION.md): Tổng hợp 100% kiến trúc, cơ sở dữ liệu SQLite, các tính năng đã hoàn thiện, danh sách API, và các quy tắc nghiệp vụ.
> 2. [`WORKFLOW.md`](file:///d:/ClassManagers/app/WORKFLOW.md): Quy trình 5 bước phát triển, Testing Protocol kiểm thử thực tế và quy chuẩn Release.

---

## ⚡ TÓM TẮT NHANH (QUICK CHEAT-SHEET)
- **App Port**: `http://localhost:3005` (Next.js 16.3.2 App Router, TypeScript).
- **Database**: SQLite cục bộ `d:\ClassManagers\database\classmanagers.db` (chạy qua `better-sqlite3` với WAL mode).
- **Môn học trọng tâm**: Giáo viên hiện tại chuyên dạy **Tiếng Anh, Toán Tiếng Anh (Math in English), Khoa học Tiếng Anh (Science in English)**.
- **AI Model ưu tiên cho Gemini**: `gemini-3.5-flash` và `gemini-3.7-flash` (Tuyệt đối không dùng model 1.5/pro cũ vì Google đã chặn trên tài khoản mới).
- **Nguyên tắc**: Luôn có `ConfirmDialog` cho thao tác xóa; luôn chống trùng lặp câu hỏi (Deduplication); luôn chạy `npm run build` kiểm tra trước khi hoàn tất.

<!-- END:nextjs-agent-rules -->
