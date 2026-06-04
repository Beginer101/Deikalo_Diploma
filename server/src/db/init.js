// Ініціалізація схеми БД: виконує schema.sql
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  try {
    await pool.query(sql);
    console.log('✅ Схему бази даних успішно створено.');
  } catch (err) {
    console.error('❌ Помилка ініціалізації схеми:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

init();
