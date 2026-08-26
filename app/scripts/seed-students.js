const Database = require('better-sqlite3');
const db = new Database('d:/ClassManagers/database/classmanagers.db');

const classId = 'class-3a';
const existing = db.prepare('SELECT name FROM students WHERE class_id = ?').all(classId).map(r => r.name);
console.log('Existing students:', existing.length);

const names = [
  'Nguyễn Minh Anh', 'Trần Hoàng Long', 'Lê Thu Hà', 'Phạm Quốc Bảo',
  'Vũ Tuấn Kiệt', 'Đặng Phương Linh', 'Bùi Gia Hưng', 'Hồ Khánh Vy',
  'Ngô Quang Huy', 'Dương Thảo Nguyên', 'Lý Anh Tuấn', 'Cao Bảo Trân',
  'Phan Đức Phúc', 'Đỗ Hải Yến', 'Mai Tiến Đạt', 'Lương Mỹ Duyên',
  'Tô Bảo Khang', 'Vũ Trâm Anh', 'Lâm Quang Vinh', 'Tăng Như Quỳnh',
  'Chu Hải Đăng', 'Hà Gia Hân',
];

const insert = db.prepare(`INSERT INTO students (id, class_id, name, avatar_config, seat_row, seat_col, is_active, created_at) VALUES (@id, @class_id, @name, @avatar_config, @seat_row, @seat_col, 1, datetime('now'))`);

const tx = db.transaction((rows) => {
  let added = 0;
  for (let i = 0; i < rows.length; i++) {
    const name = rows[i];
    if (existing.includes(name)) continue;
    const id = 'stu-seed-' + (Date.now() + i) + '-' + i;
    insert.run({
      id,
      class_id: classId,
      name,
      avatar_config: '{}',
      seat_row: Math.floor((existing.length + i) / 8),
      seat_col: (existing.length + i) % 8,
    });
    added++;
  }
  return added;
});

const added = tx(names);
console.log('Added:', added);

const total = db.prepare('SELECT COUNT(*) as n FROM students WHERE class_id = ?').get(classId);
console.log('Total students in class:', total.n);
db.close();
