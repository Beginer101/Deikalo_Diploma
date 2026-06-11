// Послідовно застосовує всі міграції з src/db/migrations/ (за алфавітом).
// Усі міграції написані ідемпотентно (IF NOT EXISTS тощо), тому скрипт
// безпечно запускати при кожному старті сервера:  npm run db:migrate
//
// Тимчасові мережеві помилки (DNS бази ще не готовий після старту
// інстансу, типово для Render free tier) не валять процес одразу —
// виконується до 12 повторних спроб з інтервалом 5 секунд.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

const TRANSIENT = ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];
const MAX_ATTEMPTS = 12;
const DELAY_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDb() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      const transient = TRANSIENT.some((c) => String(err.code || err.message).includes(c));
      if (!transient || attempt === MAX_ATTEMPTS) throw err;
      console.log(`⏳ База даних ще недоступна (${err.code || err.message}), спроба ${attempt}/${MAX_ATTEMPTS}…`);
      await sleep(DELAY_MS);
    }
  }
}

async function migrate() {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  try {
    await waitForDb();
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
