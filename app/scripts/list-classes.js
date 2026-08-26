const Database = require('better-sqlite3');
const db = new Database('d:/ClassManagers/database/classmanagers.db');
const classes = db.prepare('SELECT id, name, school_year, grade_level FROM classes').all();
console.log(JSON.stringify(classes, null, 2));
const counts = db.prepare('SELECT class_id, COUNT(*) as n FROM students GROUP BY class_id').all();
console.log(JSON.stringify(counts, null, 2));
db.close();
