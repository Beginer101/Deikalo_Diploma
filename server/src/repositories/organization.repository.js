import { pool } from '../db/pool.js';

// organizationId = null → усі організації (адміністратор),
// інакше — лише вказана (звичайні користувачі бачать тільки свою)
export async function listWithCounts(db = pool, organizationId = null) {
  const { rows } = await db.query(
    `SELECT o.*,
            (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) AS members_count,
            (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id) AS projects_count
     FROM organizations o
     WHERE ($1::int IS NULL OR o.id = $1)
     ORDER BY o.name`,
    [organizationId]
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

// ---- Запрошення до організації (одноразові тимчасові посилання) ----

export async function createInvite(db = pool, { token, organization_id, role, created_by, expires_at }) {
  const { rows } = await db.query(
    `INSERT INTO organization_invites (token, organization_id, role, created_by, expires_at)
     VALUES ($1,$2,$3::user_role,$4,$5) RETURNING *`,
    [token, organization_id, role, created_by, expires_at]
  );
  return rows[0];
}

export async function findInviteByToken(db = pool, token) {
  const { rows } = await db.query(
    `SELECT i.*, o.name AS organization_name
     FROM organization_invites i
     JOIN organizations o ON o.id = i.organization_id
     WHERE i.token = $1`,
    [token]
  );
  return rows[0];
}

// Атомарне "погашення" одноразового запрошення: спрацьовує лише один раз
export async function claimInvite(db = pool, id, userId) {
  const { rows } = await db.query(
    `UPDATE organization_invites SET used_by = $1, used_at = now()
     WHERE id = $2 AND used_at IS NULL
     RETURNING id`,
    [userId, id]
  );
  return rows[0];
}

export async function listInvites(db = pool, organizationId) {
  const { rows } = await db.query(
    `SELECT i.id, i.token, i.role, i.expires_at, i.used_at, i.created_at,
            c.full_name AS created_by_name, u.full_name AS used_by_name
     FROM organization_invites i
     LEFT JOIN users c ON c.id = i.created_by
     LEFT JOIN users u ON u.id = i.used_by
     WHERE i.organization_id = $1
     ORDER BY i.created_at DESC`,
    [organizationId]
  );
  return rows;
}
