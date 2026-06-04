import { pool } from '../db/pool.js';

export async function create(db = pool, { userId, type, message, link }) {
  await db.query(
    `INSERT INTO notifications (user_id, type, message, link) VALUES ($1,$2,$3,$4)`,
    [userId, type || 'info', message, link || null]
  );
}

export async function list(db = pool, userId, unreadOnly = false) {
  let sql = 'SELECT * FROM notifications WHERE user_id = $1';
  if (unreadOnly) sql += ' AND is_read = false';
  sql += ' ORDER BY created_at DESC LIMIT 100';
  const { rows } = await db.query(sql, [userId]);
  return rows;
}

export async function countUnread(db = pool, userId) {
  const { rows } = await db.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return Number(rows[0].count);
}

export async function markRead(db = pool, id, userId) {
  await db.query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
}

export async function markAllRead(db = pool, userId) {
  await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
}
