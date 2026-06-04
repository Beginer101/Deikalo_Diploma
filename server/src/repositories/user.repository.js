// Шар доступу до даних користувачів. Усі функції приймають виконавця `db`
// (пул або транзакційний клієнт), що дозволяє брати участь у транзакціях.
import { pool } from '../db/pool.js';

export async function create(db = pool, { full_name, email, password_hash, organization_id }) {
  const { rows } = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, organization_id)
     VALUES ($1,$2,$3,'member',$4)
     RETURNING id, full_name, email, role, organization_id`,
    [full_name, email, password_hash, organization_id || null]
  );
  return rows[0];
}

export async function findByEmail(db = pool, email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

export async function findProfileById(db = pool, id) {
  const { rows } = await db.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.organization_id, o.name AS organization_name
     FROM users u LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0];
}

export async function findEmailById(db = pool, id) {
  const { rows } = await db.query('SELECT email FROM users WHERE id = $1', [id]);
  return rows[0]?.email || null;
}

export async function list(db = pool, { organization_id } = {}) {
  const params = [];
  let sql = `SELECT u.id, u.full_name, u.email, u.role, u.organization_id,
                    o.name AS organization_name
             FROM users u LEFT JOIN organizations o ON o.id = u.organization_id`;
  if (organization_id) {
    params.push(organization_id);
    sql += ` WHERE u.organization_id = $1`;
  }
  sql += ' ORDER BY u.full_name';
  const { rows } = await db.query(sql, params);
  return rows;
}

export async function updateRole(db = pool, id, role) {
  const { rows } = await db.query(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id, full_name, email, role, organization_id`,
    [role, id]
  );
  return rows[0];
}
