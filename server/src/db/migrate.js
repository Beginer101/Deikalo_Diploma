// Послідовно застосовує всі міграції з src/db/migrations/ (за алфавітом).
// Усі міграції написані ідемпотентно (IF NOT EXISTS тощо), тому скрипт
// безпечно запускати при кожному старті сервера:  npm run db:migrate
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

async function migrate() {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  try {
    for (const f of files) {
      await pool.query(fs.readFileSync(path.join(dir, f), 'utf-8'));
      console.log(`✅ Міграцію застосовано: ${f}`);
    }
  } catch (err) {
    console.error('❌ Помилка міграції:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
