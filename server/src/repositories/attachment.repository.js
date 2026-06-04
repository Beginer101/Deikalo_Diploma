import { pool } from '../db/pool.js';

export async function listByDocument(db = pool, documentId) {
  const { rows } = await db.query(
    `SELECT a.id, a.original_name, a.mime_type, a.size_bytes, a.created_at,
            u.full_name AS uploaded_by_name
     FROM attachments a LEFT JOIN users u ON u.id = a.uploaded_by
     WHERE a.document_id = $1 ORDER BY a.created_at`,
    [documentId]
  );
  return rows;
}

export async function create(db = pool, a) {
  const { rows } = await db.query(
    `INSERT INTO attachments (document_id, filename, original_name, mime_type, size_bytes, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, original_name, mime_type, size_bytes, created_at`,
    [a.document_id, a.filename, a.original_name, a.mime_type, a.size_bytes, a.uploaded_by]
  );
  return rows[0];
}

export async function findById(db = pool, id) {
  const { rows } = await db.query('SELECT * FROM attachments WHERE id = $1', [id]);
  return rows[0];
}

export async function remove(db = pool, id) {
  await db.query('DELETE FROM attachments WHERE id = $1', [id]);
}
