const db = require('better-sqlite3')('d:/ClassManagers/database/classmanagers.db');
const ev = db.prepare("SELECT COUNT(*) n FROM evaluations WHERE student_id IN (SELECT id FROM students WHERE name = 'Test Import B')").get();
const ar = db.prepare("SELECT COUNT(*) n FROM attendance_records WHERE student_id IN (SELECT id FROM students WHERE name = 'Test Import B')").get();
console.log(JSON.stringify({ evals: ev.n, attendance: ar.n }));
if (ev.n === 0 && ar.n === 0) {
  const r = db.prepare("DELETE FROM students WHERE name = 'Test Import B'").run();
  console.log('hard-deleted:', r.changes);
} else {
  console.log('Có dữ liệu liên quan, giữ lại bản ghi soft-delete.');
}
db.close();
