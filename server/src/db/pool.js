import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  console.error('Несподівана помилка пулу PostgreSQL:', err);
});

// Зручна обгортка для запитів поза транзакціями
export const query = (text, params) => pool.query(text, params);
