import { pool } from '../db/pool.js';

export async function list(db = pool) {
  const { rows } = await db.query(
    `SELECT t.*, u.full_name AS author_name
     FROM document_templates t LEFT JOIN users u ON u.id = t.created_by
     ORDER BY t.name`
  );
  return rows;
}

export async function create(db = pool, { name, doc_type, content, created_by }) {
  const { rows } = await db.query(
    `INSERT INTO document_templates (name, doc_type, content, created_by)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, doc_type || 'загальний', content || null, created_by]
  );
  return rows[0];
}

export async function update(db = pool, id, { name, doc_type, content }) {
  const { rows } = await db.query(
    `UPDATE document_templates SET
       name = COALESCE($1,name),
       doc_type = COALESCE($2,doc_type),
       content = COALESCE($3,content)
     WHERE id = $4 RETURNING *`,
    [name, doc_type, content, id]
  );
  return rows[0];
}

export async function remove(db = pool, id) {
  await db.query('DELETE FROM document_templates WHERE id = $1', [id]);
}
