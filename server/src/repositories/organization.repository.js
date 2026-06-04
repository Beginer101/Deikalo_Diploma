import { pool } from '../db/pool.js';

export async function listWithCounts(db = pool) {
  const { rows } = await db.query(
    `SELECT o.*,
            (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) AS members_count,
            (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id) AS projects_count
     FROM organizations o ORDER BY o.name`
  );
  return rows;
}

export async function findById(db = pool, id) {
  const { rows } = await db.query('SELECT * FROM organizations WHERE id = $1', [id]);
  return rows[0];
}

export async function create(db = pool, { name, description }) {
  const { rows } = await db.query(
    'INSERT INTO organizations (name, description) VALUES ($1,$2) RETURNING *',
    [name, description || null]
  );
  return rows[0];
}

export async function update(db = pool, id, { name, description }) {
  const { rows } = await db.query(
    `UPDATE organizations SET name = COALESCE($1,name), description = COALESCE($2,description)
     WHERE id = $3 RETURNING *`,
    [name, description, id]
  );
  return rows[0];
}

export async function remove(db = pool, id) {
  await db.query('DELETE FROM organizations WHERE id = $1', [id]);
}
