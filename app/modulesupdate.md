# Prompt cho AI Agent: Nâng cấp module "Tạo bộ câu hỏi bằng AI"

## Bối cảnh

Bạn đang làm việc trên một module đã có sẵn trong hệ thống, cho phép người dùng nhập môn học, chủ đề/bài học, loại câu hỏi và số lượng, sau đó gọi Google Gemini API (free tier) để tự động sinh bộ câu hỏi. Nhiệm vụ của bạn là **nâng cấp logic sinh câu hỏi ở phần backend** để đạt 3 mục tiêu:

1. Câu hỏi **chính xác** về kiến thức.
2. Bộ câu hỏi **phong phú, đa dạng góc độ**.
3. **Không trùng lặp** giữa các lần tạo cho cùng một chủ đề.

Tất cả vẫn phải hoạt động tốt trong giới hạn của các API miễn phí. Không thay đổi UI hiện có trừ khi cần thiết để hỗ trợ tính năng mới (ví dụ: trạng thái loading nhiều bước, hiển thị cảnh báo khi thiếu câu do lọc trùng).

## Việc cần làm trước tiên

Trước khi sửa code, hãy:

1. Đọc toàn bộ codebase hiện tại của module này để hiểu: cấu trúc thư mục, service/hàm đang gọi Gemini API, model dữ liệu, nơi lưu câu hỏi, ngôn ngữ/framework đang dùng.
2. Xác định nơi lưu cấu hình API key (UI hiện đã có mục "Cấu hình AI (Google Gemini Free)").
3. Không phá vỡ các tính năng đang hoạt động: chọn môn học, chọn loại câu hỏi (trắc nghiệm ABCD), chọn số lượng (3/5/10/15 câu).
4. Nếu có điểm nào trong prompt này chưa rõ hoặc xung đột với cấu trúc code hiện tại, **hãy dừng lại và hỏi** thay vì tự suy đoán rồi triển khai sai.

## Kiến trúc mục tiêu (pipeline mới)

```
Input (môn học, chủ đề, số lượng, loại câu hỏi)
  → Phân rã chủ đề thành các chủ đề con
  → Prompt Builder (thêm ràng buộc chống trùng + ví dụ mẫu)
  → Gọi LLM (JSON schema mode) với cơ chế fallback nhiều nhà cung cấp
  → Sinh dư ~30% rồi lọc: JSON hợp lệ + dedup bằng embedding + xác minh đáp án
  → Lưu vào "ngân hàng câu hỏi" (kèm embedding, chủ đề, chủ đề con)
  → Trả kết quả về UI
```

## Yêu cầu triển khai chi tiết

### 1. Phân rã chủ đề (topic decomposition)

- Trước khi gọi model sinh câu hỏi chính, gọi 1 lần LLM (hoặc rule đơn giản nếu chủ đề rõ ràng) để tách chủ đề người dùng nhập thành 3-5 chủ đề con.
- Ví dụ: `"các loại phương tiện"` → `["phương tiện đường bộ", "phương tiện đường thủy", "phương tiện đường hàng không", "phương tiện đường sắt"]`.
- Phân bổ đều số câu hỏi cần tạo qua các chủ đề con (ví dụ 5 câu / 4 chủ đề con → 2-1-1-1).
- Nếu số lượng câu hỏi nhỏ (3 câu) hoặc chủ đề đã đủ hẹp, có thể bỏ qua bước này.

### 2. Prompt Builder có cấu trúc

Dùng template sau, thay các biến trong `{}`:

```
Bạn là chuyên gia soạn đề thi môn {subject}.
Nhiệm vụ: tạo {count_with_buffer} câu hỏi {question_type} về chủ đề: "{topic}".

Phân bổ số câu theo các chủ đề con sau: {subtopic_distribution}

Yêu cầu bắt buộc:
1. Câu hỏi chính xác về kiến thức, đúng phạm vi chủ đề đã nêu.
2. Đáp án nhiễu (sai) phải hợp lý nhưng chắc chắn sai — không mơ hồ, không có 2 đáp án cùng đúng.
3. Đa dạng độ khó: pha trộn dễ / trung bình / khó.
4. TUYỆT ĐỐI không lặp nội dung hoặc cách diễn đạt với các câu hỏi sau đây (đã tồn tại trong hệ thống):
{existing_questions_context}
5. Mỗi câu hỏi phải có trường "explanation" giải thích ngắn gọn vì sao đáp án đó đúng.
6. Trả lời CHỈ bằng JSON đúng theo schema đã cung cấp, không thêm text nào khác ngoài JSON.
```

Ghi chú:
- `existing_questions_context`: lấy tối đa 10-15 câu hỏi **gần nghĩa nhất** với chủ đề hiện tại từ ngân hàng câu hỏi (dùng embedding similarity — xem mục 5), không nhét toàn bộ lịch sử để tránh tốn token.
- `count_with_buffer` = `count * GENERATION_BUFFER_RATIO` (làm tròn lên) — sinh dư để bù phần bị lọc trùng.

### 3. Gọi LLM với JSON Schema + fallback đa nhà cung cấp

- Dùng chế độ structured output của Gemini (`responseMimeType: "application/json"` + `responseSchema`) — schema ở mục 6.
- Xây một lớp trừu tượng `generateQuestions(prompt, schema)` không phụ thuộc provider cụ thể, thử theo thứ tự:
  1. **Gemini 2.5 Flash** (API key người dùng đã cấu hình).
  2. **Groq** (Llama 3.3 70B hoặc gpt-oss-120b) — nếu Gemini lỗi 429 hoặc timeout.
  3. **OpenRouter** (model free bất kỳ còn quota) — nếu cả 2 trên đều lỗi.
- Với mỗi provider: exponential backoff cho lỗi 429 (retry sau 1s, 2s, 4s — tối đa 3 lần) trước khi chuyển provider kế tiếp.
- Nếu người dùng chưa cấu hình key cho Groq/OpenRouter, hệ thống chỉ dùng Gemini — không báo lỗi, chỉ bỏ qua bước fallback.

### 4. Vòng thẩm định (verification pass)

Sau khi có JSON câu hỏi hợp lệ, gọi thêm 1 lần LLM (ưu tiên provider **khác** với provider đã sinh câu hỏi ở bước 3, nếu có sẵn):

```
Dưới đây là danh sách câu hỏi trắc nghiệm môn {subject}, chủ đề "{topic}":
{questions_json}

Với mỗi câu, kiểm tra:
1. Đáp án đúng (correct_index) có thực sự đúng không.
2. 3 đáp án còn lại có thực sự sai và không gây mơ hồ không.

Nếu phát hiện lỗi, sửa lại. Trả về JSON đã sửa theo đúng schema ban đầu, không thêm text khác.
```

- Nếu không có provider thứ 2 khả dụng, dùng lại chính provider đã sinh câu hỏi — vẫn có giá trị vì là lượt gọi độc lập.
- Cho phép bật/tắt bước này qua config `ENABLE_VERIFICATION_PASS` (mặc định `true`).

### 5. Chống trùng lặp (2 lớp)

- **Lớp 1 — in-prompt**: đã mô tả ở mục 2 (`existing_questions_context`).
- **Lớp 2 — embedding similarity** (lớp lọc cuối, quan trọng nhất):
  1. Sau khi có JSON đã qua thẩm định, với mỗi câu hỏi mới, gọi Gemini Embedding API (`text-embedding-004`) lấy vector.
  2. Tính cosine similarity với embedding các câu hỏi đã lưu **cùng môn học + chủ đề**.
  3. Similarity cao nhất > `DEDUP_SIMILARITY_THRESHOLD` (mặc định 0.90) → coi là trùng, loại khỏi kết quả.
  4. Nếu số câu còn lại sau lọc < số lượng yêu cầu (`count`): nếu thiếu ít (≤ 2 câu) thì gọi lại 1 lần để bù; nếu không, trả về số câu hiện có kèm cảnh báo cho UI.

### 6. Schema JSON dùng cho toàn bộ pipeline

```json
{
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": { "type": "string" },
          "options": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 4,
            "maxItems": 4
          },
          "correct_index": { "type": "integer" },
          "explanation": { "type": "string" },
          "difficulty": { "type": "string", "enum": ["easy", "medium", "hard"] },
          "subtopic": { "type": "string" }
        },
        "required": ["question", "options", "correct_index", "explanation", "difficulty", "subtopic"]
      }
    }
  },
  "required": ["questions"]
}
```

### 7. Cập nhật lưu trữ (ngân hàng câu hỏi)

Thêm/cập nhật bảng lưu câu hỏi với các trường:

```
questions
├── id
├── subject          -- môn học
├── topic            -- chủ đề gốc người dùng nhập
├── subtopic         -- chủ đề con (từ bước 1)
├── question_text
├── options           (JSON array)
├── correct_index
├── explanation
├── difficulty
├── embedding          (vector — dùng cho dedup lần sau)
├── created_at
```

- Nếu database hiện tại không hỗ trợ kiểu vector, lưu `embedding` dưới dạng JSON array of float và tính cosine similarity ở tầng ứng dụng — không cần vector DB chuyên dụng ở quy mô nhỏ/vừa.

### 8. Biến môi trường cần thêm

```
GEMINI_API_KEY=                    (đã có sẵn)
GEMINI_EMBEDDING_MODEL=text-embedding-004
GROQ_API_KEY=                      (tùy chọn — fallback)
OPENROUTER_API_KEY=                (tùy chọn — fallback cuối)
DEDUP_SIMILARITY_THRESHOLD=0.90
GENERATION_BUFFER_RATIO=1.3
ENABLE_VERIFICATION_PASS=true
```

### 9. Cập nhật UI (nếu cần)

- Thêm trạng thái loading chi tiết hơn thay vì 1 spinner đơn, ví dụ: "Đang phân tích chủ đề...", "Đang sinh câu hỏi...", "Đang kiểm tra trùng lặp...".
- Nếu tất cả provider đều lỗi/hết quota, hiển thị thông báo rõ ràng, dễ hiểu cho người dùng cuối (không phải lỗi kỹ thuật thô).
- Nếu số câu trả về ít hơn yêu cầu do lọc trùng, hiển thị cảnh báo nhẹ, ví dụ: "Đã tạo 4/5 câu do trùng lặp với câu hỏi đã có".

## Tiêu chí nghiệm thu (Definition of Done)

- [ ] Sinh câu hỏi qua Gemini với JSON schema mode, parse không lỗi.
- [ ] Khi Gemini trả lỗi 429 (giả lập được), hệ thống tự động chuyển sang Groq rồi OpenRouter.
- [ ] Với cùng 1 chủ đề, tạo 2 lần liên tiếp → không có câu hỏi trùng nội dung giữa 2 lần (kiểm chứng bằng embedding similarity dưới ngưỡng).
- [ ] Mỗi câu hỏi có trường `explanation` và đã qua ít nhất 1 lượt thẩm định.
- [ ] Câu hỏi được lưu vào DB kèm `embedding`, `subtopic`, có thể truy vấn lại theo `subject` + `topic`.
- [ ] Không có tính năng cũ nào trên UI bị hỏng.

## Thứ tự triển khai đề xuất

1. Prompt Builder có cấu trúc (mục 2)
2. JSON Schema mode (mục 6)
3. Cập nhật DB schema (mục 7)
4. Dedup bằng embedding (mục 5)
5. Verification pass (mục 4)
6. Multi-provider fallback (mục 3)
7. Phân rã chủ đề (mục 1)
8. Cập nhật UI (mục 9)

Thứ tự này đảm bảo phần lõi (chính xác + đúng định dạng) hoạt động trước, sau đó mới thêm lớp chống trùng lặp và mở rộng độ bền của hệ thống.
