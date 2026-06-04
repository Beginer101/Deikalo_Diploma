import { pool } from '../db/pool.js';

export async function list(db = pool, { organization_id, status } = {}) {
  const params = [];
  const where = [];
  if (organization_id) {
    params.push(organization_id);
    where.push(`p.organization_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`p.status = $${params.length}`);
  }
  const { rows } = await db.query(
    `SELECT p.*, o.name AS organization_name, u.full_name AS owner_name,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS tasks_count,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS tasks_done
     FROM projects p
     LEFT JOIN organizations o ON o.id = p.organization_id
     LEFT JOIN users u ON u.id = p.owner_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY p.created_at DESC`,
    params
  );
  return rows;
}

export async function findById(db = pool, id) {
  const { rows } = await db.query(
    `SELECT p.*, o.name AS organization_name, u.full_name AS owner_name
     FROM projects p
     LEFT JOIN organizations o ON o.id = p.organization_id
     LEFT JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0];
}

export async function listMembers(db = pool, projectId) {
  const { rows } = await db.query(
    `SELECT m.id, m.role_label, u.id AS user_id, u.full_name, u.email
     FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.project_id = $1 ORDER BY u.full_name`,
    [projectId]
  );
  return rows;
}

export async function create(db = pool, p) {
  const { rows } = await db.query(
    `INSERT INTO projects (title, description, status, organization_id, owner_id, start_date, end_date)
     VALUES ($1,$2,COALESCE($3,'planned'),$4,$5,$6,$7) RETURNING *`,
    [p.title, p.description || null, p.status || null, p.organization_id,
     p.owner_id, p.start_date || null, p.end_date || null]
  );
  return rows[0];
}

export async function update(db = pool, id, p) {
  const { rows } = await db.query(
    `UPDATE projects SET
       title = COALESCE($1,title),
       description = COALESCE($2,description),
       status = COALESCE($3,status),
       start_date = COALESCE($4,start_date),
       end_date = COALESCE($5,end_date)
     WHERE id = $6 RETURNING *`,
    [p.title, p.description, p.status, p.start_date, p.end_date, id]
  );
  return rows[0];
}

export async function addMember(db = pool, projectId, userId, roleLabel) {
  const { rows } = await db.query(
    `INSERT INTO memberships (user_id, project_id, role_label)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id, project_id) DO UPDATE SET role_label = EXCLUDED.role_label
     RETURNING *`,
    [userId, projectId, roleLabel || 'учасник']
  );
  return rows[0];
}

export async function removeMember(db = pool, projectId, userId) {
  await db.query('DELETE FROM memberships WHERE project_id = $1 AND user_id = $2', [
    projectId, userId,
  ]);
}

export async function remove(db = pool, id) {
  await db.query('DELETE FROM projects WHERE id = $1', [id]);
}

// Чи є користувач координатором/організатором хоча б в одному проєкті
export async function isCoordinatorAnywhere(db = pool, userId) {
  const { rows } = await db.query(
    `SELECT 1 FROM memberships
     WHERE user_id = $1 AND role_label IN ('координатор', 'організатор') LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
}

// Роль користувача в конкретному проєкті (role_label) або null
export async function getMemberRole(db = pool, projectId, userId) {
  const { rows } = await db.query(
    'SELECT role_label FROM memberships WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return rows[0]?.role_label || null;
}
