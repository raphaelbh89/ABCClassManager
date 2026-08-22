// d:/ClassManagers/app/seed_rich.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/classmanagers.db');
const db = new Database(dbPath);

const richQuestions = [
  // ─── TOÁN HỌC ───
  {
    id: 'math-1',
    subject: 'Toán học',
    content: '5 × 8 bằng bao nhiêu?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '35' },
      { label: 'B', text: '40' },
      { label: 'C', text: '45' },
      { label: 'D', text: '50' }
    ]),
    correct: 'B',
    duration: 15
  },
  {
    id: 'math-2',
    subject: 'Toán học',
    content: '1 mét bằng bao nhiêu xăng-ti-mét (cm)?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '10 cm' },
      { label: 'B', text: '50 cm' },
      { label: 'C', text: '100 cm' },
      { label: 'D', text: '1000 cm' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'math-3',
    subject: 'Toán học',
    content: 'Số liền sau của số 999 là số nào?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '998' },
      { label: 'B', text: '1001' },
      { label: 'C', text: '990' },
      { label: 'D', text: '1000' }
    ]),
    correct: 'D',
    duration: 15
  },
  {
    id: 'math-4',
    subject: 'Toán học',
    content: 'Hình tròn có mấy đỉnh và mấy cạnh thẳng?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '0 đỉnh và 0 cạnh thẳng' },
      { label: 'B', text: '1 đỉnh và 1 cạnh' },
      { label: 'C', text: '2 đỉnh và 2 cạnh' },
      { label: 'D', text: '4 đỉnh và 4 cạnh' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'math-5',
    subject: 'Toán học',
    content: 'Một tuần lễ có bao nhiêu ngày?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '5 ngày' },
      { label: 'B', text: '6 ngày' },
      { label: 'C', text: '7 ngày' },
      { label: 'D', text: '8 ngày' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'math-6',
    subject: 'Toán học',
    content: '45 : 5 bằng bao nhiêu?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '7' },
      { label: 'B', text: '8' },
      { label: 'C', text: '9' },
      { label: 'D', text: '10' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'math-7',
    subject: 'Toán học',
    content: 'Phép tính nào dưới đây có kết quả lớn nhất?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '4 × 6' },
      { label: 'B', text: '3 × 9' },
      { label: 'C', text: '5 × 5' },
      { label: 'D', text: '6 × 5' }
    ]),
    correct: 'D',
    duration: 20
  },

  // ─── TIẾNG VIỆT ───
  {
    id: 'tv-1',
    subject: 'Tiếng Việt',
    content: 'Từ nào sau đây là từ chỉ hoạt động?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Bông hoa' },
      { label: 'B', text: 'Chạy nhảy' },
      { label: 'C', text: 'Xinh xắn' },
      { label: 'D', text: 'Ngôi nhà' }
    ]),
    correct: 'B',
    duration: 15
  },
  {
    id: 'tv-2',
    subject: 'Tiếng Việt',
    content: 'Câu nào dưới đây thuộc kiểu câu: "Ai là gì?"',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Bác Hồ là vị lãnh tụ vĩ đại.' },
      { label: 'B', text: 'Mẹ em đang nấu cơm.' },
      { label: 'C', text: 'Chú mèo rất tinh nghịch.' },
      { label: 'D', text: 'Học sinh đang đọc sách.' }
    ]),
    correct: 'A',
    duration: 20
  },
  {
    id: 'tv-3',
    subject: 'Tiếng Việt',
    content: 'Từ nào viết ĐÚNG chính tả?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Giành giật' },
      { label: 'B', text: 'Xum xuê' },
      { label: 'C', text: 'Xúc xắc' },
      { label: 'D', text: 'Gia đình' }
    ]),
    correct: 'D',
    duration: 15
  },
  {
    id: 'tv-4',
    subject: 'Tiếng Việt',
    content: 'Trong câu: "Trăng tròn như quả bóng bay", tác giả đã dùng biện pháp nghệ thuật gì?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Nhân hóa' },
      { label: 'B', text: 'Điệp từ' },
      { label: 'C', text: 'So sánh' },
      { label: 'D', text: 'Ẩn dụ' }
    ]),
    correct: 'C',
    duration: 20
  },

  // ─── TỰ NHIÊN & XÃ HỘI ───
  {
    id: 'tnxh-1',
    subject: 'Tự nhiên & Xã hội',
    content: 'Cơ quan nào trong cơ thể người có nhiệm vụ co bóp đẩy máu đi khắp cơ thể?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Dạ dày' },
      { label: 'B', text: 'Phổi' },
      { label: 'C', text: 'Trái tim' },
      { label: 'D', text: 'Lá gan' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'tnxh-2',
    subject: 'Tự nhiên & Xã hội',
    content: 'Cây xanh nhả khí gì vào ban ngày giúp con người hô hấp trong lành?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Khí Ô-xy (O2)' },
      { label: 'B', text: 'Khí Các-bô-níc (CO2)' },
      { label: 'C', text: 'Khí Ni-tơ (N2)' },
      { label: 'D', text: 'Khí Mê-tan' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'tnxh-3',
    subject: 'Tự nhiên & Xã hội',
    content: 'Động vật nào sau đây đẻ trứng?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Con Chó' },
      { label: 'B', text: 'Con Mèo' },
      { label: 'C', text: 'Con Gà' },
      { label: 'D', text: 'Con Bò' }
    ]),
    correct: 'C',
    duration: 15
  },

  // ─── TIẾNG ANH ───
  {
    id: 'en-1',
    subject: 'Tiếng Anh',
    content: 'What color is the sun?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Blue' },
      { label: 'B', text: 'Green' },
      { label: 'C', text: 'Yellow' },
      { label: 'D', text: 'Purple' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'en-2',
    subject: 'Tiếng Anh',
    content: 'How many days are there in a week?',
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Five days' },
      { label: 'B', text: 'Six days' },
      { label: 'C', text: 'Seven days' },
      { label: 'D', text: 'Eight days' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'en-3',
    subject: 'Tiếng Anh',
    content: 'True or False: Fish can fly in the sky like birds.',
    type: 'true_false',
    options: JSON.stringify([
      { label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' },
      { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }
    ]),
    correct: 'B',
    duration: 15
  },
  {
    id: 'en-4',
    subject: 'Tiếng Anh',
    content: 'True or False: An elephant is bigger than a mouse.',
    type: 'true_false',
    options: JSON.stringify([
      { label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' },
      { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'en-5',
    subject: 'Tiếng Anh',
    content: 'True or False: Ice is hot.',
    type: 'true_false',
    options: JSON.stringify([
      { label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' },
      { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }
    ]),
    correct: 'B',
    duration: 15
  }
];

db.prepare('DELETE FROM questions').run();

for (const q of richQuestions) {
  db.prepare(`
    INSERT INTO questions (id, teacher_id, subject, content, question_type, options, correct_answer, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(q.id, 'teacher-1', q.subject, q.content, q.type, q.options, q.correct, q.duration);
}

console.log('Seeded successfully with count:', richQuestions.length);
