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
    `SELECT u.id, u.full_name, u.email, u.role, u.organization_id,
            u.telegram, u.discord, u.phone,
            o.name AS organization_name
     FROM users u LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0];
}

// Оновлення особистого профілю (усі поля опціональні).
// Порожній рядок очищує поле, undefined — залишає як було.
export async function updateProfile(db = pool, id, { email, telegram, discord, phone }) {
  const norm = (v) => (v === undefined ? undefined : (v === '' ? null : v));
  const { rows } = await db.query(
    `UPDATE users SET
       email    = COALESCE($1, email),
       telegram = CASE WHEN $5 THEN $2 ELSE telegram END,
       discord  = CASE WHEN $6 THEN $3 ELSE discord  END,
       phone    = CASE WHEN $7 THEN $4 ELSE phone    END
     WHERE id = $8
     RETURNING id, full_name, email, role, organization_id, telegram, discord, phone`,
    [
      email || null,
      norm(telegram) ?? null, norm(discord) ?? null, norm(phone) ?? null,
      telegram !== undefined, discord !== undefined, phone !== undefined,
      id,
    ]
  );
  return rows[0];
}

export async function updatePassword(db = pool, id, passwordHash) {
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
}

export async function findWithPassword(db = pool, id) {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

// Керівники організації з контактами (для публічної сторінки організації)
export async function listHeadsByOrganization(db = pool, organizationId) {
  const { rows } = await db.query(
    `SELECT id, full_name, email, telegram, discord, phone
     FROM users
     WHERE role = 'head' AND organization_id = $1
     ORDER BY full_name`,
    [organizationId]
  );
  return rows;
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

export async function findById(db = pool, id) {
  const { rows } = await db.query(
    'SELECT id, full_name, email, role, organization_id FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

// Зміна організації користувача (+ опційно ролі — при приєднанні за запрошенням)
export async function updateOrganization(db = pool, id, organizationId, role) {
  const { rows } = await db.query(
    `UPDATE users SET organization_id = $1, role = COALESCE($2::user_role, role)
     WHERE id = $3
     RETURNING id, full_name, email, role, organization_id`,
    [organizationId, role || null, id]
  );
  return rows[0];
}

// "Спостерігачі" дій: усі адміністратори системи + хеди вказаної організації.
// Використовується для фан-ауту сповіщень про активність.
export async function findWatchers(db = pool, organizationId) {
  const params = [];
  let sql = `SELECT id FROM users WHERE role = 'admin'`;
  if (organizationId) {
    params.push(organizationId);
    sql += ` OR (role = 'head' AND organization_id = $1)`;
  }
  const { rows } = await db.query(sql, params);
  return rows;
}

export async function remove(db = pool, id) {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
}

export async function countAdmins(db = pool) {
  const { rows } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
  return Number(rows[0].count);
}

export async function listAdminIds(db = pool) {
  const { rows } = await db.query("SELECT id FROM users WHERE role = 'admin'");
  return rows.map((r) => r.id);
}

// ----- Запити на видалення користувачів -----
export async function createDeletionRequest(db = pool, { targetUserId, requestedBy, reason }) {
  const { rows } = await db.query(
    `INSERT INTO user_deletion_requests (target_user_id, requested_by, reason)
     VALUES ($1, $2, $3) RETURNING *`,
    [targetUserId, requestedBy, reason || null]
  );
  return rows[0];
}

export async function listDeletionRequests(db = pool, status = 'pending') {
  const { rows } = await db.query(
    `SELECT r.*, t.full_name AS target_name, t.email AS target_email,
            rq.full_name AS requested_by_name
     FROM user_deletion_requests r
     JOIN users t ON t.id = r.target_user_id
     LEFT JOIN users rq ON rq.id = r.requested_by
     WHERE ($1::deletion_request_status IS NULL OR r.status = $1)
     ORDER BY r.created_at DESC`,
    [status]
  );
  return rows;
}

export async function findDeletionRequest(db = pool, id) {
  const { rows } = await db.query('SELECT * FROM user_deletion_requests WHERE id = $1', [id]);
  return rows[0];
}

export async function updateDeletionRequestStatus(db = pool, id, status, reviewedBy) {
  const { rows } = await db.query(
    `UPDATE user_deletion_requests
     SET status = $1, reviewed_by = $2, reviewed_at = now()
     WHERE id = $3 RETURNING *`,
    [status, reviewedBy, id]
  );
  return rows[0];
}

export async function hasPendingRequest(db = pool, targetUserId) {
  const { rows } = await db.query(
    `SELECT 1 FROM user_deletion_requests
     WHERE target_user_id = $1 AND status = 'pending' LIMIT 1`,
    [targetUserId]
  );
  return rows.length > 0;
}
