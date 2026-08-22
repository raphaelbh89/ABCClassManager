// d:/ClassManagers/app/clean_duplicates.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/classmanagers.db');
const db = new Database(dbPath);

// Xoá các câu hỏi trùng lặp
db.prepare("DELETE FROM questions WHERE topic = 'các loại phương tiện'").run();

// Thêm bộ câu hỏi chuẩn Tiếng Anh về Phương Tiện Giao Thông (Vehicles & Transportation)
const vehicleQuestions = [
  {
    id: 'veh-1',
    subject: 'Tiếng Anh',
    topic: 'Các loại phương tiện (Vehicles)',
    content: "Which vehicle flies in the sky and carries many passengers?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Airplane' },
      { label: 'B', text: 'Bicycle' },
      { label: 'C', text: 'Submarine' },
      { label: 'D', text: 'Bus' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'veh-2',
    subject: 'Tiếng Anh',
    topic: 'Các loại phương tiện (Vehicles)',
    content: "How many wheels does a bicycle have?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'One wheel' },
      { label: 'B', text: 'Two wheels' },
      { label: 'C', text: 'Three wheels' },
      { label: 'D', text: 'Four wheels' }
    ]),
    correct: 'B',
    duration: 15
  },
  {
    id: 'veh-3',
    subject: 'Tiếng Anh',
    topic: 'Các loại phương tiện (Vehicles)',
    content: "Which vehicle travels on rails and has many carriages?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Train' },
      { label: 'B', text: 'Boat' },
      { label: 'C', text: 'Car' },
      { label: 'D', text: 'Helicopter' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'veh-4',
    subject: 'Tiếng Anh',
    topic: 'Các loại phương tiện (Vehicles)',
    content: "Which vehicle sails on the ocean or river?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Ship' },
      { label: 'B', text: 'Truck' },
      { label: 'C', text: 'Motorbike' },
      { label: 'D', text: 'Train' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'veh-5',
    subject: 'Tiếng Anh',
    topic: 'Các loại phương tiện (Vehicles)',
    content: "What vehicle do firefighters use to put out fires?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Fire truck' },
      { label: 'B', text: 'Taxi' },
      { label: 'C', text: 'Bicycle' },
      { label: 'D', text: 'Ambulance' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'veh-6',
    subject: 'Tiếng Anh',
    topic: 'Các loại phương tiện (Vehicles)',
    content: "Which vehicle is used to take sick people to the hospital?",
    type: 'mcq',
    options: JSON.stringify([
      { label: 'A', text: 'Ambulance' },
      { label: 'B', text: 'Bus' },
      { label: 'C', text: 'Subway' },
      { label: 'D', text: 'Scooter' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'veh-7',
    subject: 'Tiếng Anh',
    topic: 'Các loại phương tiện (Vehicles)',
    content: "True or False: A helicopter has large blades on top to fly in the air.",
    type: 'true_false',
    options: JSON.stringify([
      { label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' },
      { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }
    ]),
    correct: 'A',
    duration: 15
  },
  {
    id: 'veh-8',
    subject: 'Tiếng Anh',
    topic: 'Các loại phương tiện (Vehicles)',
    content: "True or False: Cars can drive underwater like submarines.",
    type: 'true_false',
    options: JSON.stringify([
      { label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' },
      { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }
    ]),
    correct: 'B',
    duration: 15
  }
];

for (const q of vehicleQuestions) {
  db.prepare(`
    INSERT INTO questions (id, teacher_id, subject, topic, content, question_type, options, correct_answer, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(q.id, 'teacher-1', q.subject, q.topic, q.content, q.type, q.options, q.correct, q.duration);
}

console.log('Cleaned up duplicates and seeded Vehicles questions successfully');
