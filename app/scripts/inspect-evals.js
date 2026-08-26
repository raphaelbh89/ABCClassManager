const db = require('better-sqlite3')('d:/ClassManagers/database/classmanagers.db', { readonly: true });
console.log('=== evaluations grouped by criteria ===');
console.log(JSON.stringify(db.prepare('SELECT criteria_id, SUM(score) s, COUNT(*) n FROM evaluations GROUP BY criteria_id').all(), null, 1));
console.log('=== criteria of class-3a ===');
console.log(JSON.stringify(db.prepare("SELECT id, name, is_active FROM criteria WHERE class_id='class-3a'").all(), null, 1));
console.log('=== last 5 evaluations ===');
console.log(JSON.stringify(db.prepare('SELECT * FROM evaluations ORDER BY evaluated_at DESC LIMIT 5').all(), null, 1));
db.close();
