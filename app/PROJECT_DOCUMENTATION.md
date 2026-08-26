# 📚 TÀI LIỆU DỰ ÁN TOÀN DIỆN: CLASSMANAGER PRO
> **Dành riêng cho AI Agents & Developers kế thừa dự án**: Đọc tài liệu này để nắm bắt 100% kiến trúc, database, luồng nghiệp vụ và quy tắc phát triển mà không cần đọc lại toàn bộ codebase.

---

## 1. TỔNG QUAN HỆ THỐNG (PROJECT OVERVIEW)

- **Tên dự án**: **ClassManager Pro**
- **Mục tiêu**: Nền tảng quản lý lớp học tiểu học thông minh dành cho Giáo viên (đặc biệt tối ưu cho môn **Tiếng Anh, Toán Tiếng Anh, Khoa học Tiếng Anh**), tích hợp:
  - Điểm danh và nhận diện câu trả lời bằng thẻ màu qua Camera Mobile/Webcam.
  - Hệ thống Game hóa (Gamification / RPG) với 4 chế độ thi đấu: **1v1 Khắc đấu máu**, **Tổ vs Tổ**, **Toàn lớp tính điểm**, **Đánh Boss diệt quái hoạt hình**.
  - Màn chiếu TV (`/display`) đồng bộ thời gian thực siêu tốc với Điện thoại giáo viên điều khiển (`/scanner`).
  - Ngân hàng câu hỏi thông minh tích hợp **AI Generator** (Google Gemini 3.5/3.7, OpenAI ChatGPT, Groq Llama, Custom Endpoints) và chống trùng lặp dữ liệu tuyệt đối.
- **Môi trường chạy**:
  - **Framework**: Next.js 16.3.2 (App Router, Turbopack, React 19, TypeScript).
  - **Database**: SQLite cục bộ qua `better-sqlite3` với chế độ `WAL mode` và `foreign_keys = ON`, tốc độ phản hồi `< 1ms`, lưu tại `d:\ClassManagers\database\classmanagers.db`.
  - **Realtime**: Đồng bộ trạng thái 2 chiều giữa màn chiếu TV và Mobile qua WebSocket Server / SSE / BroadcastChannel (`/api/realtime`).
  - **Cổng chạy mặc định**: `http://localhost:3005`.

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN (PROJECT DIRECTORY STRUCTURE)

```
d:\ClassManagers\
├── database\
│   ├── classmanagers.db        # File CSDL SQLite chính thức
│   ├── schema.sql              # Bản vẽ kiến trúc schema SQL
│   └── migrations\             # Các file migration nâng cấp DB
├── app\
│   ├── AGENTS.md               # Chỉ dẫn bắt buộc cho AI Agent khi khởi động
│   ├── CLAUDE.md               # Entry point hướng dẫn Agent
│   ├── WORKFLOW.md             # Quy trình phát triển & Testing Protocol chuẩn
│   ├── CHANGELOG.md            # Lịch sử phiên bản (Keep a Changelog)
│   ├── package.json            # Version hiện tại: 1.1.0
│   ├── next.config.ts
│   └── src\
│       ├── app\
│       │   ├── (dashboard)\    # Các trang có Sidebar điều hướng
│       │   │   ├── dashboard\  # Tổng quan lớp học, thống kê chuyên cần, thi đua
│       │   │   ├── classes\    # Quản lý lớp học (Lớp 3A, 4B, Room Code)
│       │   │   ├── students\   # Quản lý học sinh, avatar thú cưng, sơ đồ chỗ ngồi
│       │   │   ├── attendance\ # Điểm danh thẻ màu trực quan
│       │   │   ├── race\       # Vòng quay may mắn / Cuộc đua gọi trả bài
│       │   │   ├── game\       # Trung tâm trò chơi (Launcher 4 chế độ, chọn Topic)
│       │   │   ├── questions\  # Ngân hàng câu hỏi, tạo AI, Test Key, lọc Topic
│       │   │   └── settings\   # Cài đặt môn giảng dạy, API Key AI, đổi mật khẩu
│       │   ├── display\        # Màn hình chiếu TV lớp học (/display)
│       │   ├── scanner\        # Màn hình điều khiển giáo viên & camera scan (/scanner)
│       │   ├── login\          # Đăng nhập giáo viên
│       │   ├── register\       # Đăng ký tài khoản
│       │   └── api\            # Hệ thống API REST & WebSocket
│       │       ├── ai\test\    # API kiểm tra kết nối API Key AI & dò tìm model
│       │       ├── auth\       # API đăng nhập, đổi mật khẩu
│       │       ├── classes\    # CRUD lớp học
│       │       ├── students\   # CRUD học sinh
│       │       ├── questions\  # CRUD câu hỏi, sinh câu hỏi bằng AI
│       │       ├── games\      # Quản lý phiên game session
│       │       ├── attendance\ # Quản lý điểm danh
│       │       ├── evaluations\# Đánh giá tiêu chí & cộng điểm RPG
│       │       └── realtime\   # Kênh đồng bộ thời gian thực
│       ├── components\
│       │   ├── common\         # Button, Card, Modal, Badge, ConfirmDialog
│       │   ├── layout\         # Sidebar, Header
│       │   ├── display\        # DisplayScreen (Màn chiếu TV, Boss, 1v1, Podium)
│       │   └── scanner\        # ScannerControlPanel (Camera AI, Nút điều khiển)
│       ├── context\
│       │   └── ClassContext.tsx# State lưu lớp học hiện tại (currentClass)
│       ├── hooks\
│       │   ├── useQuestions.ts # Hook quản lý câu hỏi
│       │   ├── useStudents.ts  # Hook quản lý học sinh
│       │   └── useAttendance.ts# Hook quản lý điểm danh
│       ├── lib\
│       │   └── db.ts           # Kết nối Better-SQLite3, auto-migrations & seeder
│       ├── services\
│       │   ├── aiGenerator.ts  # Engine AI tạo câu hỏi đa model & chống trùng lặp
│       │   ├── games.ts        # Quản lý phiên game & cộng điểm RPG
│       │   └── questions.ts    # Service gọi API ngân hàng câu hỏi
│       ├── types\
│       │   └── index.ts        # Toàn bộ TypeScript Type definitions
│       └── utils\
│           └── exportReports.ts# Xuất báo cáo Excel, PDF
```

---

## 3. CƠ SỞ DỮ LIỆU SQLITE (DATABASE SCHEMA & RELATIONS)

Hệ thống sử dụng SQLite với Foreign Keys được kích hoạt (`ON DELETE CASCADE`):

1. **`teachers`**: `id (PK)`, `name`, `email (UNIQUE)`, `school`, `password_hash`, `created_at`.
2. **`classes`**: `id (PK)`, `teacher_id (FK)`, `name` (Lớp 3A), `school_year` (2025-2026), `grade_level` (3), `room_code (UNIQUE)`, `is_active`.
3. **`students`**: `id (PK)`, `class_id (FK)`, `name`, `avatar_config (JSON)`, `seat_row`, `seat_col`, `is_active`.
4. **`criteria`**: `id (PK)`, `class_id (FK)`, `name`, `icon`, `max_score`, `sort_order`, `is_active`.
5. **`evaluations`**: `id (PK)`, `student_id (FK)`, `criteria_id (FK)`, `score`, `note`, `session_type`, `evaluated_at`.
6. **`attendance_sessions`**: `id (PK)`, `class_id (FK)`, `date (YYYY-MM-DD)`, `confirmed_at`, `UNIQUE(class_id, date)`.
7. **`attendance_records`**: `id (PK)`, `session_id (FK)`, `student_id (FK)`, `status` ('present'|'absent'|'late'), `note`.
8. **`questions`**: `id (PK)`, `teacher_id`, `subject`, `topic`, `content`, `question_type` ('mcq'|'true_false'), `options (JSON)`, `correct_answer` ('A'|'B'|'C'|'D'), `duration_seconds`, `is_active`.
9. **`game_sessions`**: `id (PK)`, `class_id (FK)`, `game_type` ('1v1'|'group_battle'|'class_quiz'|'boss_raid'), `template (JSON)`, `status` ('waiting'|'active'|'finished'), `room_code`.

---

## 4. CHI TIẾT CÁC CỤM TÍNH NĂNG ĐÃ HOÀN THÀNH

### 🎮 A. Hệ Thống Game & Màn Chiếu Lớp Học (Gamification)
1. **4 Chế Độ Trò Chơi Thực Tế**:
   - **⚔️ 1v1 (Đấu tay đôi - HP Bar)**: Giáo viên chọn 2 học sinh; 2 thanh máu trừ dần khi trả lời sai; kết thúc hiện người chiến thắng.
   - **🚩 Tổ vs Tổ (Group Battle)**: Chia lớp theo tổ/dãy bàn, tính điểm tích lũy theo đội.
   - **🏆 Toàn Lớp (Class Quiz)**: Chấm điểm toàn diện từng học sinh theo thẻ màu A/B/C/D.
   - **🐉 Đánh Boss Diệt Quái (Boss Raid)**: Quái vật hoạt hình có thanh HP chung của lớp; lớp trả lời đúng > 80% thì Boss bị tiêu diệt!
2. **Đồng Bộ Realtime Scanner $\leftrightarrow$ Display**:
   - Màn chiếu TV (`/display`) không tự động nhảy câu hỏi; **chỉ hiển thị khi Giáo viên trên Mobile (`/scanner`) bấm "Đẩy câu hỏi lên TV"**.
   - Khi kết thúc trận đấu, Popup **Vinh Danh Chiến Thắng (Victory Modal)** hiển thị trên cả 2 màn hình kèm nút:
     - `⭐ +10 Điểm Thưởng RPG`: Cộng trực tiếp vào sổ điểm học sinh.
     - `🏠 Quay lại phần mềm`: Điều hướng giáo viên về trang chọn game.
3. **Xáo Trộn Đáp Án Ngẫu Nhiên**: Tự động xáo trộn vị trí 4 phương án A, B, C, D khi bắt đầu câu hỏi để đáp án đúng không bị dồn về phương án A.

---

### 🤖 B. Trí Tuệ Nhân Tạo & Quản Lý Câu Hỏi Theo Chủ Đề (AI Engine)
1. **Engine AI Đa Nhà Cung Cấp (`src/services/aiGenerator.ts`)**:
   - **Google Gemini**: Tự động hỗ trợ các model thế hệ mới nhất: **`gemini-3.5-flash`**, **`gemini-3.7-flash`**, `gemini-flash-latest`, `gemini-3.6-flash`.
   - **OpenAI ChatGPT**: Model `gpt-4o-mini` qua tài khoản OpenAI API.
   - **Groq Llama**: Tự động quét và kết nối với `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`...
   - **Custom Endpoint**: Tương thích OpenAI API (DeepSeek API, OpenRouter, Local Ollama...).
2. **API Kiểm Tra Key (`/api/ai/test`)**:
   - Bấm nút `Test Key` trên giao diện để kiểm tra ngay lập tức trạng thái Key và thời gian phản hồi (Latency ms).
3. **Cơ Chế Chống Lặp Câu Hỏi Tuyệt Đối (Anti-Duplication)**:
   - Trước khi lưu vào DB, hệ thống kiểm tra `SELECT LOWER(TRIM(content))` và tự động loại bỏ mọi câu hỏi đã có sẵn.
4. **Phân Loại & Lọc Theo Chủ Đề (Topic Tabs)**:
   - Hỗ trợ gán nhãn chủ đề (`🎯 Đại từ xưng hô (Pronouns)`, `🎯 Các loại phương tiện (Vehicles)`, `🎯 Động vật (Animals)`, `🎯 Toán Tiếng Anh`, `🎯 Khoa học Tiếng Anh`...).
   - Trang `/game` cho phép 1-chạm chọn toàn bộ câu hỏi của chủ đề đó để thi đấu ngay.

---

### ⚙️ C. Cài Đặt Chuyên Môn & Trải Nghiệm Giáo Viên
1. **Cài Đặt Môn Giảng Dạy (`/settings`)**:
   - Lưu vào LocalStorage: `classmanager_teaching_subject`.
   - Các tuỳ chọn: *Tất cả Tiếng Anh (Mặc định)*, *Tiếng Anh ngôn ngữ*, *Toán Tiếng Anh (Math in English)*, *Khoa học Tiếng Anh (Science in English)*, *Toàn bộ môn*.
   - Tự động ẩn các môn học không liên quan (như Tiếng Việt, Toán tiếng Việt) để giao diện luôn tinh gọn.
2. **Quản Lý API Key Tập Trung**: Lưu `classmanager_ai_key`, `classmanager_ai_provider`, `classmanager_ai_base_url`, `classmanager_ai_model` an toàn trong trình duyệt giáo viên.

---

## 5. LOCAL STORAGE KEYS QUAN TRỌNG

| Key Name | Giá trị mẫu | Mục đích |
| :--- | :--- | :--- |
| `classmanager_teaching_subject` | `'all_english'`, `'Tiếng Anh'`, `'Toán Tiếng Anh'` | Môn giảng dạy mặc định của GV |
| `classmanager_ai_key` | `'AQ.Ab8RN...'`, `'sk-...'`, `'gsk_...'` | API Key AI đang sử dụng |
| `classmanager_ai_provider` | `'gemini'`, `'openai'`, `'groq'`, `'custom'` | Nhà cung cấp AI đang chọn |
| `classmanager_ai_base_url` | `'https://api.deepseek.com/v1'` | Base URL cho Custom Endpoint |
| `classmanager_ai_model` | `'deepseek-chat'` | Tên Model cho Custom Endpoint |

---

## 6. LƯU Ý SỐNG CÒN KHI TIẾP TỤC PHÁT TRIỂN (CRITICAL RULES)

1. **Không Hardcode Tên Model Gemini cũ**:
   - Google đã khai tử `gemini-1.5-flash` và `gemini-pro` trên các tài khoản mới; luôn sử dụng danh sách ưu tiên: `gemini-3.5-flash`, `gemini-3.7-flash`, `gemini-flash-latest`.
2. **Luôn Kèm Popup Xác Nhận (ConfirmDialog)**:
   - Bất kỳ thao tác Xoá (học sinh, câu hỏi, lớp học) nào cũng **phải có ConfirmDialog** trước khi gọi API xoá.
3. **Bảo Toàn Liên Kết SQLite**:
   - Khi chỉnh sửa bảng `questions`, luôn gửi và cập nhật đầy đủ các trường `topic`, `options`, `correct_answer`, `duration_seconds`.
4. **Kiểm Tra Build Trước Khi Hoàn Tất**:
   - Luôn chạy `npm run build` để kiểm tra TypeScript và Turbopack compile không phát sinh lỗi trước khi bàn giao cho người dùng.
