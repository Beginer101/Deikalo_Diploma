import { pool } from '../db/pool.js';

export async function list(db = pool, { project_id, assignee_id, status } = {}) {
  const params = [];
  const where = [];
  for (const [col, val] of [
    ['project_id', project_id],
    ['assignee_id', assignee_id],
    ['status', status],
  ]) {
    if (val) {
      params.push(val);
      where.push(`t.${col} = $${params.length}`);
    }
  }
  const { rows } = await db.query(
    `SELECT t.*, u.full_name AS assignee_name, p.title AS project_title
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     LEFT JOIN projects p ON p.id = t.project_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY t.created_at DESC`,
    params
  );
  return rows;
}

export async function create(db = pool, t) {
  const { rows } = await db.query(
    `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date)
     VALUES ($1,$2,COALESCE($3,'todo'),COALESCE($4,'medium'),$5,$6,$7) RETURNING *`,
    [t.title, t.description || null, t.status || null, t.priority || null,
     t.project_id, t.assignee_id || null, t.due_date || null]
  );
  return rows[0];
}

export async function update(db = pool, id, t) {
  const { rows } = await db.query(
    `UPDATE tasks SET
       title = COALESCE($1,title),
       description = COALESCE($2,description),
       status = COALESCE($3,status),
       priority = COALESCE($4,priority),
       assignee_id = COALESCE($5,assignee_id),
       due_date = COALESCE($6,due_date)
     WHERE id = $7 RETURNING *`,
    [t.title, t.description, t.status, t.priority, t.assignee_id, t.due_date, id]
  );
  return rows[0];
}

export async function remove(db = pool, id) {
  await db.query('DELETE FROM tasks WHERE id = $1', [id]);
}
