// d:/ClassManagers/app/clean_and_seed_pronoun.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/classmanagers.db');
const db = new Database(dbPath);

// Xoá các câu hỏi toán bị gắn nhầm Tiếng Anh
db.prepare("DELETE FROM questions WHERE subject = 'Tiếng Anh' AND content LIKE '%phép tính%'").run();
db.prepare("DELETE FROM questions WHERE content LIKE '%Chủ đề xưng hô: Kết quả của phép tính%'").run();

// Thêm bộ câu hỏi chuẩn Tiếng Anh chủ đề Xưng hô (Pronouns)
const pronounQuestions = [
  {
    id: 'en-pronoun-1',
    subject: 'Tiếng Anh',
    content: "Which English pronoun replaces 'My mother' in a sentence?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'He' },
      { label: 'B', text: 'She' },
      { label: 'C', text: 'It' },
      { label: 'D', text: 'They' }
    ]),
    correct: 'B',
    duration: 15
  },
  {
    id: 'en-pronoun-2',
    subject: 'Tiếng Anh',
    content: "What is the English pronoun for 'Tôi'?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'I' },
      { label: 'B', text: 'You' },
      { label: 'C', text: 'We' },
      { label: 'D', text: 'They' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'en-pronoun-3',
    subject: 'Tiếng Anh',
    content: "Choose the correct pronoun: '___ is my best friend.' (Nam)",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'She' },
      { label: 'B', text: 'It' },
      { label: 'C', text: 'He' },
      { label: 'D', text: 'We' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'en-pronoun-4',
    subject: 'Tiếng Anh',
    content: "Which pronoun replaces 'Tom and Jerry'?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'We' },
      { label: 'B', text: 'They' },
      { label: 'C', text: 'He' },
      { label: 'D', text: 'It' }
    ]),
    correct: 'B',
    duration: 15
  },
  {
    id: 'en-pronoun-5',
    subject: 'Tiếng Anh',
    content: "Which pronoun is used for an animal or a thing?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'They' },
      { label: 'B', text: 'You' },
      { label: 'C', text: 'It' },
      { label: 'D', text: 'He' }
    ]),
    correct: 'C',
    duration: 15
  }
];

for (const q of pronounQuestions) {
  db.prepare(`
    INSERT INTO questions (id, teacher_id, subject, content, question_type, options, correct_answer, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(q.id, 'teacher-1', q.subject, q.content, q.type, q.options, q.correct, q.duration);
}

console.log('Cleaned up and added English Pronoun questions successfully');
