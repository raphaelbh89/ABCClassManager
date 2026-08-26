const Database = require('better-sqlite3');
const db = new Database('d:/ClassManagers/database/classmanagers.db');

// Gán tên tiếng Anh gợi nhớ theo tên/tiếng Việt của từng em
const englishNames = {
  'Nguyễn Văn An': 'Andy',
  'Trần Thị Bình': 'Bella',
  'Lê Hoàng Cúc': 'Daisy',
  'Phạm Minh Đức': 'David',
  'Vũ Ngọc Hân': 'Helen',
  'Đỗ Quốc Khánh': 'Kevin',
  'Bùi Mai Linh': 'Lily',
  'Hoàng Gia Nam': 'Nathan',
  'Nguyễn Minh Anh': 'Angela',
  'Trần Hoàng Long': 'Leo',
  'Lê Thu Hà': 'Hailey',
  'Phạm Quốc Bảo': 'Bobby',
  'Vũ Tuấn Kiệt': 'Jack',
  'Đặng Phương Linh': 'Linda',
  'Bùi Gia Hưng': 'Henry',
  'Hồ Khánh Vy': 'Vivian',
  'Ngô Quang Huy': 'Hugo',
  'Dương Thảo Nguyên': 'Olivia',
  'Lý Anh Tuấn': 'Tony',
  'Cao Bảo Trân': 'Tracy',
  'Phan Đức Phúc': 'Felix',
  'Đỗ Hải Yến': 'Jenny',
  'Mai Tiến Đạt': 'Daniel',
  'Lương Mỹ Duyên': 'Mia',
  'Tô Bảo Khang': 'Kelvin',
  'Vũ Trâm Anh': 'Amy',
  'Lâm Quang Vinh': 'Victor',
  'Tăng Như Quỳnh': 'Quinn',
  'Chu Hải Đăng': 'Dylan',
  'Hà Gia Hân': 'Hannah',
};

const update = db.prepare('UPDATE students SET english_name = ? WHERE name = ? AND (english_name IS NULL OR english_name = \'\')');
const tx = db.transaction(() => {
  let updated = 0;
  for (const [vn, en] of Object.entries(englishNames)) {
    const r = update.run(en, vn);
    updated += r.changes;
  }
  return updated;
});

try {
  const n = tx();
  console.log('Updated:', n);
} catch (e) {
  if (String(e).includes('no such column')) {
    console.error('Cột english_name chưa tồn tại — chạy app 1 lần để migration tự chạy trước.');
    process.exit(1);
  }
  throw e;
}

const total = db.prepare("SELECT COUNT(*) AS n FROM students WHERE english_name IS NOT NULL AND english_name != ''").get();
console.log('Students with english_name:', total.n);

const missing = db.prepare("SELECT name FROM students WHERE english_name IS NULL OR english_name = ''").all();
if (missing.length) console.log('Missing:', JSON.stringify(missing));
db.close();
