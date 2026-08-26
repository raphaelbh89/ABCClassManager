const db = require('better-sqlite3')('d:/ClassManagers/database/classmanagers.db');
// Câu vừa chèn trong 10 phút qua (do test tạo)
const recent = db.prepare("SELECT id, content, topic, created_at FROM questions WHERE created_at >= datetime('now', '-10 minutes')").all();
console.log('recent:', JSON.stringify(recent, null, 1));
const ids = recent.map(r => r.id);
if (ids.length > 0) {
  const del = db.prepare(`UPDATE questions SET is_active = 0 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
  console.log('deactivated:', del.changes);
}
db.close();
