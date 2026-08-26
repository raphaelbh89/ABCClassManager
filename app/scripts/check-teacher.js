const db = require('better-sqlite3')('d:/ClassManagers/database/classmanagers.db', { readonly: true });
const t = db.prepare('SELECT id, name, school FROM teachers LIMIT 1').get();
console.log(JSON.stringify(t));
db.close();
