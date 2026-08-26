const db = require('better-sqlite3')('d:/ClassManagers/database/classmanagers.db');
const r = db.prepare("DELETE FROM evaluations WHERE note LIKE '[TEST]%'").run();
console.log('removed test evals:', r.changes);

// Tổng hợp công bằng hôm nay: mỗi HS được cộng bao nhiêu, từ hoạt động nào
const rows = db.prepare(`
  SELECT s.name,
    SUM(CASE WHEN e.session_type = 'quick' THEN e.score ELSE 0 END) AS diem_tra_bai,
    SUM(CASE WHEN e.session_type = 'game' THEN e.score ELSE 0 END) AS diem_tro_choi,
    SUM(e.score) AS tong
  FROM evaluations e JOIN students s ON s.id = e.student_id
  WHERE date(e.evaluated_at) = date('now', 'localtime')
  GROUP BY e.student_id ORDER BY tong DESC
`).all();
console.log('Hôm nay:');
for (const r2 of rows) console.log(` - ${r2.name}: trả bài ${r2.diem_tra_bai}đ · trò chơi ${r2.diem_tro_choi}đ · tổng ${r2.tong}đ`);
db.close();
