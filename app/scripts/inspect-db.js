const Database = require('better-sqlite3');
const db = new Database('d:/ClassManagers/database/classmanagers.db', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(tables, null, 2));
for (const t of tables) {
  const info = db.prepare(`PRAGMA table_info(${t.name})`).all();
  console.log(`\n--- ${t.name} ---`);
  console.log(info.map(c => `${c.name} ${c.type}${c.pk ? ' PK' : ''}`).join(', '));
}
db.close();
