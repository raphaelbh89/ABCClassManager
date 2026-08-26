const db = require('better-sqlite3')('d:/ClassManagers/database/classmanagers.db', { readonly: true });
const rows = db.prepare("SELECT name, english_name FROM students WHERE is_active = 1 ORDER BY name LIMIT 8").all();
console.log(JSON.stringify(rows));
console.log('total active with english:', db.prepare("SELECT COUNT(*) AS n FROM students WHERE is_active = 1 AND english_name IS NOT NULL AND english_name != ''").get().n);
db.close();
