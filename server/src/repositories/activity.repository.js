import { pool } from '../db/pool.js';

export async function create(db = pool, { userId, entityType, entityId, action, summary }) {
  await db.query(
    `INSERT INTO activity_log (user_id, entity_type, entity_id, action, summary)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId || null, entityType, entityId || null, action, summary]
  );
}

export async function list(db = pool, { entity_type, limit = 50 } = {}) {
  const params = [];
  let where = '';
  if (entity_type) {
    params.push(entity_type);
    where = `WHERE a.entity_type = $${params.length}`;
  }
  params.push(Math.min(Number(limit) || 50, 200));
  const { rows } = await db.query(
    `SELECT a.*, u.full_name AS user_name
     FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${params.length}`,
    params
  );
  return rows;
}
