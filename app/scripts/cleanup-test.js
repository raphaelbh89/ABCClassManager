const db = require('better-sqlite3')('d:/ClassManagers/database/classmanagers.db');
const r = db.prepare("UPDATE students SET is_active = 0 WHERE name LIKE 'Test Import%'").run();
console.log('soft-deleted:', r.changes);
db.close();
