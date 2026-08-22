# KẾ HOẠCH DỰ ÁN
## Ứng dụng Quản lý Lớp học Game hóa dành cho Giáo viên Tiểu học

---

## 1. Tổng quan

**Đối tượng thao tác:** Giáo viên (dùng máy tính/TV để trình chiếu + điện thoại để điều khiển/quét).
**Đối tượng hưởng lợi:** Học sinh tiểu học (KHÔNG dùng thiết bị riêng, chỉ tương tác vật lý: giơ tay, giơ thẻ màu, trả lời miệng).
**Ràng buộc quan trọng:** Mọi tương tác của học sinh phải đi qua giáo viên hoặc camera của giáo viên — không có app/tài khoản riêng cho học sinh ở giai đoạn đầu.

**4 module chính theo yêu cầu:**
1. Điểm danh bằng ảnh chụp lớp + sơ đồ chỗ ngồi đã khởi tạo
2. Nhân vật học sinh + đánh giá đa tiêu chí theo quá trình
3. Tạo game/quiz: cá nhân, đối kháng đơn, đối kháng nhóm, tập thể
4. Trình chiếu (Display) tách biệt + quét kết quả bằng camera di động (Scanner)

---

## 2. Kiến trúc tổng thể

### 2.1 Mô hình 2 thiết bị đồng bộ real-time
- **Display Mode**: web app chạy trên trình duyệt máy tính, xuất ra TV/máy chiếu. Hiển thị câu hỏi, bảng xếp hạng, hiệu ứng, đồng hồ đếm ngược.
- **Scanner/Control Mode**: web app (PWA) chạy trên điện thoại giáo viên. Dùng để: chấm điểm nhanh, chụp ảnh điểm danh, bật camera quét thẻ màu/đáp án, điều khiển toàn bộ luồng tiết học.
- Hai chế độ đồng bộ với nhau qua **room code** (giống Kahoot nhưng vai trò đảo ngược: giáo viên điều khiển cả 2 đầu, học sinh chỉ xem).

### 2.2 Đề xuất công nghệ (có thể điều chỉnh theo năng lực đội dev)
| Thành phần | Đề xuất | Lý do |
|---|---|---|
| Frontend | Next.js (React) | Dùng chung codebase cho Display & Scanner, dễ deploy dạng PWA |
| Backend | Next.js API routes hoặc Node.js (Fastify) | Đơn giản, cùng ngôn ngữ với frontend |
| Real-time sync | Socket.io hoặc Firebase Realtime Database/Firestore | Cần độ trễ thấp giữa Scanner và Display |
| Database | PostgreSQL (tự quản) hoặc Supabase/Firebase (nhanh, có sẵn auth+storage+realtime) | Tuỳ quy mô, khuyến nghị Supabase cho giai đoạn MVP |
| Xử lý ảnh điểm danh | Object/person detection theo từng vùng ghế, chạy được bằng TensorFlow.js/MediaPipe ngay trên trình duyệt | Tránh phải nhận diện khuôn mặt (xem mục 3) |
| Xử lý ảnh thẻ màu | Color detection bằng Canvas API, xử lý ngay trên điện thoại (client-side) | Nhanh, không cần gửi ảnh lên server, giảm độ trễ |
| PWA | Có (installable, hoạt động khi mạng chập chờn, sync lại sau) | Lớp học có thể wifi yếu |

---

## 3. Nguyên tắc dữ liệu & quyền riêng tư (bắt buộc lưu ý — đối tượng là trẻ em)

- **Không dùng nhận diện khuôn mặt để định danh học sinh.** Thay vào đó dùng **"phát hiện có người theo vị trí ghế" (seat-based presence detection)**: hệ thống chỉ cần biết ô ghế nào có người ngồi, ô nào trống, rồi map theo sơ đồ lớp đã khởi tạo sẵn (tên học sinh gắn với từng ô ghế). Cách này đơn giản hơn, chính xác hơn, và tránh vấn đề đạo đức/pháp lý khi lưu dữ liệu sinh trắc học của trẻ em.
- **Khi học sinh đổi chỗ:** giáo viên chỉnh tay trên sơ đồ (giao diện kéo-thả), không cần hệ thống tự nhận diện lại danh tính.
- **Ảnh chụp** (điểm danh, quét thẻ) nên xử lý xong là xoá hoặc không lưu trữ dài hạn, trừ khi giáo viên chủ động lưu làm bằng chứng cho một trường hợp cụ thể.
- Không yêu cầu học sinh có tài khoản đăng nhập riêng.

---

## 4. Chi tiết từng module

### Module 1 — Điểm danh bằng ảnh + sơ đồ lớp
**Setup ban đầu:**
- Giáo viên tạo sơ đồ lớp dạng lưới (hàng x cột), kéo-thả tên/avatar học sinh vào từng ô ghế.

**Luồng điểm danh:**
1. Giáo viên chụp 1 ảnh toàn lớp bằng điện thoại.
2. Hệ thống crop ảnh theo từng vùng ghế đã setup trước đó.
3. Với mỗi vùng: phát hiện "có người / không có người".
4. Map kết quả ngược theo sơ đồ → ra danh sách có mặt/vắng theo tên.
5. **Màn hình xác nhận:** giáo viên xem lại, sửa tay nếu sai (camera không thể chính xác 100%), rồi bấm xác nhận cuối cùng.

**Xử lý đổi chỗ:** giao diện chỉnh sơ đồ (kéo-thả) áp dụng từ lần điểm danh kế tiếp; giữ lịch sử các phiên bản sơ đồ theo thời gian để tra cứu lại điểm danh cũ đúng ngữ cảnh.

**Đầu ra:** lịch sử điểm danh theo ngày, xuất báo cáo (PDF/Excel).

---

### Module 2 — Nhân vật học sinh + đánh giá đa tiêu chí
- Mỗi học sinh có 1 **nhân vật/avatar** tuỳ chỉnh được (phù hợp thẩm mỹ trẻ em, không cần ảnh thật).
- Bộ **tiêu chí đánh giá** có thể tuỳ chỉnh, gợi ý mặc định: Học tập, Kỷ luật, Hợp tác nhóm, Sáng tạo, Chuyên cần.
- Mỗi tiêu chí có thang điểm/level riêng → tổng hợp thành "chỉ số nhân vật" kiểu RPG (stats radar chart).
- Giáo viên đánh giá:
  - **Định kỳ** (cuối buổi/tuần/tháng) — form đánh giá nhanh.
  - **Tại chỗ (quick action)** — chấm điểm ngay trong giờ học từ app điện thoại, không rời khỏi luồng tiết học.
- Biểu đồ tiến bộ theo thời gian cho từng học sinh.
- Thành tựu/huy hiệu tự động mở khi đạt mốc (ví dụ: 10 lần liên tiếp hoàn thành bài tập).

---

### Module 3 — Tạo game/quiz nhiều thể loại
**Ngân hàng nội dung:** câu hỏi/mini-game theo môn học, giáo viên tự tạo hoặc dùng template có sẵn.

**Thể loại thi đấu:**
| Loại | Mô tả |
|---|---|
| Cá nhân | Mỗi học sinh trả lời độc lập (qua giơ tay/thẻ), xếp hạng cá nhân |
| Đối kháng đơn | 1 vs 1, đấu loại trực tiếp giữa 2 học sinh được chọn |
| Đối kháng nhóm | Tổ vs tổ, tổng điểm nhóm |
| Tập thể | Cả lớp hợp tác đạt mục tiêu chung (kiểu "đánh boss chung") |

**Nguyên tắc thiết kế:** thời gian ngắn, phù hợp độ tập trung học sinh tiểu học (mỗi câu 10–30s, mỗi ván 5–10 phút).

**Template game gợi ý (mở rộng dần):** Quiz trắc nghiệm, Đúng/Sai, Ai nhanh hơn (buzzer/giơ tay), Vòng quay may mắn, Ghép cặp, Đua thanh tiến độ (progress race).

**Kết nối với Module 2 & 4:** kết quả game tự động cộng điểm vào chỉ số nhân vật; đầu vào câu trả lời lấy từ cơ chế quét thẻ màu (Module 4).

---

### Module 4 — Trình chiếu tách biệt (Display) + Quét camera di động (Scanner)
- **Display Mode:** chạy trên máy tính → xuất TV/máy chiếu. Hiện câu hỏi, bảng xếp hạng, hiệu ứng âm thanh/hình ảnh, đồng hồ đếm ngược.
- **Scanner Mode:** chạy trên điện thoại giáo viên. Bật camera, quét thẻ màu học sinh giơ lên.
- **Luồng vận hành 1 câu hỏi:**
  1. Giáo viên bấm "Hiện câu hỏi" trên điện thoại → tự động đẩy lên Display.
  2. Đếm ngược, học sinh giơ thẻ.
  3. Giáo viên bấm "Quét" → camera chụp/quét liên tục vài giây cuối để bắt khoảnh khắc ổn định.
  4. Hệ thống phân tích, hiện kết quả tạm (VD: "18 đỏ / 5 xanh").
  5. **Bắt buộc có bước xác nhận thủ công** trước khi tính điểm chính thức.
  6. Xác nhận → điểm cộng, hiệu ứng chạy trên Display.

**Cấp độ nhận diện (làm tăng dần độ khó):**
- **V1:** đếm màu Đỏ/Xanh (Đúng/Sai) — độ chính xác cao, làm trước tiên, dùng color detection đơn giản.
- **V2:** thẻ màu theo đáp án A/B/C/D (mã hoá màu theo đáp án).
- **V3 (giai đoạn sau):** gán đúng từng thẻ với đúng học sinh theo vị trí ngồi (kết hợp dữ liệu sơ đồ từ Module 1) — độ khó kỹ thuật cao nhất, không bắt buộc ở bản đầu.

**Hiệu chỉnh (calibration):** đầu giờ giáo viên chụp mẫu thẻ thật dưới ánh sáng lớp học hiện tại để hệ thống tự điều chỉnh ngưỡng nhận diện màu.

---

### Module bổ sung đề xuất (không bắt buộc ở bản đầu)
- **Kho phần thưởng:** đổi điểm/coin lấy đặc quyền trong lớp do giáo viên tự định nghĩa.
- **Báo cáo & xuất file** (PDF/Excel) để lưu hồ sơ hoặc gửi phụ huynh.
- **Quản lý nhiều lớp** cho 1 giáo viên, hoặc nhiều giáo viên trong 1 trường (multi-tenant, nếu mở rộng).
- **Chế độ "Ngày yên tĩnh"**: tắt bớt hiệu ứng âm thanh khi lớp cần tập trung cao.
- **Thư viện template** game/quiz chia sẻ giữa các giáo viên trong trường.
- **Sao lưu & khôi phục dữ liệu.**

---

## 5. Lộ trình phát triển (ưu tiên MVP, test thực tế từng bước — KHÔNG nhảy cóc)

| Phase | Nội dung | Mục tiêu kiểm thử |
|---|---|---|
| 0 | Core quản lý: lớp, học sinh, sơ đồ ghế cơ bản (chưa ảnh, chưa game) | Chạy được CRUD cơ bản, test tay |
| 1 | Điểm danh bằng ảnh (v1: chỉ phát hiện có/vắng) | Test với ảnh thật, ánh sáng thật |
| 2 | Module Nhân vật + đánh giá tiêu chí | Test luồng chấm điểm, biểu đồ |
| 3 | Display + Scanner đồng bộ cơ bản (chưa có game) | Test độ trễ đồng bộ 2 thiết bị thật |
| 4 | Game/quiz thể loại đơn giản nhất (cá nhân, trắc nghiệm) | Test trên Display+Scanner thật |
| 5 | Mở rộng thể loại game (đối kháng đơn/nhóm, tập thể) + thẻ Đỏ/Xanh | Test với học sinh thật nếu có thể |
| 6 | Nâng cấp thẻ A/B/C/D + hiệu chỉnh màu | Test nhiều điều kiện ánh sáng |
| 7 | Module bổ sung (kho phần thưởng, báo cáo, v.v.) | Theo nhu cầu thực tế phát sinh |

---

## 6. Nguyên tắc bắt buộc khi AI Agent code (quan trọng — theo yêu cầu người dùng)

1. **Không được tự ý báo "đã hoàn thành / đã chạy được"** nếu chưa thực sự build, chạy, và kiểm tra output/log thực tế.
2. Sau mỗi phần việc nhỏ: chạy lệnh thực tế (`npm run dev`, `npm run build`, `npm run test`...), dán/mô tả kết quả log cụ thể — không kết luận dựa trên "code trông có vẻ đúng".
3. Nếu gặp lỗi không tự sửa được: báo rõ lỗi là gì, không che giấu, không bỏ qua, không giả vờ đã xử lý.
4. Viết test cơ bản (unit test) cho các phần logic quan trọng: mapping sơ đồ ghế, tính điểm, đồng bộ real-time giữa Display và Scanner.
5. Với phần liên quan camera/xử lý ảnh (điểm danh, quét thẻ màu): đây là phần **không thể tự động hoá kiểm thử 100%** vì phụ thuộc ánh sáng/camera thật — Agent phải nêu rõ giới hạn này và hướng dẫn người dùng cách tự test thủ công, thay vì tự nhận là "đã hoạt động tốt".
6. Luôn đi theo đúng thứ tự các Phase ở mục 5, không gộp nhiều Phase để "làm nhanh" — mỗi Phase phải chạy và test được trước khi sang Phase tiếp theo.
