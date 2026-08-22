// d:/ClassManagers/app/seed_topics_english.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/classmanagers.db');
const db = new Database(dbPath);

try {
  db.exec('ALTER TABLE questions ADD COLUMN topic TEXT;');
} catch {}

const questionsWithTopics = [
  // ─── PHÂN MÔN 1: TIẾNG ANH - CHỦ ĐỀ: ĐẠI TỪ XƯNG HÔ (PRONOUNS) ───
  {
    id: 'en-pro-1',
    subject: 'Tiếng Anh',
    topic: 'Đại từ xưng hô (Pronouns)',
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
    id: 'en-pro-2',
    subject: 'Tiếng Anh',
    topic: 'Đại từ xưng hô (Pronouns)',
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
    id: 'en-pro-3',
    subject: 'Tiếng Anh',
    topic: 'Đại từ xưng hô (Pronouns)',
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
    id: 'en-pro-4',
    subject: 'Tiếng Anh',
    topic: 'Đại từ xưng hô (Pronouns)',
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
    id: 'en-pro-5',
    subject: 'Tiếng Anh',
    topic: 'Đại từ xưng hô (Pronouns)',
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
  },
  {
    id: 'en-pro-6',
    subject: 'Tiếng Anh',
    topic: 'Đại từ xưng hô (Pronouns)',
    content: "True or False: 'We' means 'Chúng tôi / Chúng ta'.",
    type: 'true_false',
    options: JSON.stringify([
      { label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' },
      { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }
    ]),
    correct: 'A',
    duration: 15
  },

  // ─── PHÂN MÔN 1: TIẾNG ANH - CHỦ ĐỀ: ĐỘNG VẬT & MÀU SẮC (ANIMALS & COLORS) ───
  {
    id: 'en-ani-1',
    subject: 'Tiếng Anh',
    topic: 'Động vật (Animals)',
    content: "Which animal says 'Meow'?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Dog' },
      { label: 'B', text: 'Cat' },
      { label: 'C', text: 'Bird' },
      { label: 'D', text: 'Duck' }
    ]),
    correct: 'B',
    duration: 15
  },
  {
    id: 'en-ani-2',
    subject: 'Tiếng Anh',
    topic: 'Động vật (Animals)',
    content: "What is known as the King of the Jungle?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Monkey' },
      { label: 'B', text: 'Zebra' },
      { label: 'C', text: 'Lion' },
      { label: 'D', text: 'Panda' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'en-ani-3',
    subject: 'Tiếng Anh',
    topic: 'Động vật (Animals)',
    content: "True or False: An elephant is smaller than an ant.",
    type: 'true_false',
    options: JSON.stringify([
      { label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' },
      { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }
    ]),
    correct: 'B',
    duration: 15
  },

  // ─── PHÂN MÔN 2: TOÁN TIẾNG ANH (MATH IN ENGLISH) ───
  {
    id: 'math-en-1',
    subject: 'Toán Tiếng Anh',
    topic: 'Toán Tiếng Anh (Math in English)',
    content: "What is 5 times 8? (5 × 8 = ?)",
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
    id: 'math-en-2',
    subject: 'Toán Tiếng Anh',
    topic: 'Toán Tiếng Anh (Math in English)',
    content: "Which shape has NO straight sides?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Circle' },
      { label: 'B', text: 'Square' },
      { label: 'C', text: 'Triangle' },
      { label: 'D', text: 'Rectangle' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'math-en-3',
    subject: 'Toán Tiếng Anh',
    topic: 'Toán Tiếng Anh (Math in English)',
    content: "1 kilogram (kg) equals how many grams (g)?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '1000 grams' },
      { label: 'B', text: '100 grams' },
      { label: 'C', text: '10 grams' },
      { label: 'D', text: '500 grams' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'math-en-4',
    subject: 'Toán Tiếng Anh',
    topic: 'Toán Tiếng Anh (Math in English)',
    content: "How many sides does a triangle have?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: '2 sides' },
      { label: 'B', text: '3 sides' },
      { label: 'C', text: '4 sides' },
      { label: 'D', text: '5 sides' }
    ]),
    correct: 'B',
    duration: 15
  },

  // ─── PHÂN MÔN 3: KHOA HỌC TIẾNG ANH (SCIENCE IN ENGLISH) ───
  {
    id: 'sci-en-1',
    subject: 'Khoa học Tiếng Anh',
    topic: 'Khoa học Tiếng Anh (Science in English)',
    content: "Which planet is closest to the Sun?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Mercury' },
      { label: 'B', text: 'Venus' },
      { label: 'C', text: 'Earth' },
      { label: 'D', text: 'Mars' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'sci-en-2',
    subject: 'Khoa học Tiếng Anh',
    topic: 'Khoa học Tiếng Anh (Science in English)',
    content: "Which organ pumps blood throughout the human body?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Lungs' },
      { label: 'B', text: 'Stomach' },
      { label: 'C', text: 'Heart' },
      { label: 'D', text: 'Brain' }
    ]),
    correct: 'C',
    duration: 15
  },
  {
    id: 'sci-en-3',
    subject: 'Khoa học Tiếng Anh',
    topic: 'Khoa học Tiếng Anh (Science in English)',
    content: "What gas do plants release during the day that humans breathe in?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Oxygen (O2)' },
      { label: 'B', text: 'Carbon Dioxide (CO2)' },
      { label: 'C', text: 'Nitrogen' },
      { label: 'D', text: 'Methane' }
    ]),
    correct: 'A',
    duration: 15
  }
];

db.prepare('DELETE FROM questions').run();

for (const q of questionsWithTopics) {
  db.prepare(`
    INSERT INTO questions (id, teacher_id, subject, topic, content, question_type, options, correct_answer, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(q.id, 'teacher-1', q.subject, q.topic, q.content, q.type, q.options, q.correct, q.duration);
}

console.log('Seeded successfully with topics:', questionsWithTopics.length);
