import { pool } from '../db/pool.js';

// Запити для дашборда
export async function dashboardCounts(db = pool, userId) {
  const [orgs, projects, tasks, docs, pendingForMe, myTasks] = await Promise.all([
    db.query('SELECT COUNT(*) FROM organizations'),
    db.query(`SELECT status, COUNT(*) FROM projects GROUP BY status`),
    db.query(`SELECT status, COUNT(*) FROM tasks GROUP BY status`),
    db.query(`SELECT status, COUNT(*) FROM documents GROUP BY status`),
    db.query(
      `SELECT COUNT(*) FROM document_approvals
       WHERE approver_id = $1 AND decision = 'pending'`,
      [userId]
    ),
    db.query(
      `SELECT COUNT(*) FROM tasks WHERE assignee_id = $1 AND status <> 'done'`,
      [userId]
    ),
  ]);
  return { orgs, projects, tasks, docs, pendingForMe, myTasks };
}

// Запити для розширених метрик.
// organizationId = null → уся система (адміністратор);
// інакше — лише дані вказаної організації (керівник).
// Належність до організації: документи — за автором, задачі — за проєктом,
// активність — за користувачем, що виконав дію.
export async function metrics(db = pool, organizationId = null) {
  const oid = organizationId;
  const [
    docsByStatus, docsByType, avgApproval, stuck,
    topAuthors, workload, activityByDay, totals,
  ] = await Promise.all([
    db.query(`
      SELECT d.status, COUNT(*) FROM documents d
      JOIN users u ON u.id = d.author_id
      WHERE ($1::int IS NULL OR u.organization_id = $1)
      GROUP BY d.status`, [oid]),
    db.query(`
      SELECT d.doc_type, COUNT(*) FROM documents d
      JOIN users u ON u.id = d.author_id
      WHERE ($1::int IS NULL OR u.organization_id = $1)
      GROUP BY d.doc_type ORDER BY COUNT(*) DESC`, [oid]),
    db.query(`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (last_decided - d.created_at)) / 3600), 0) AS hours
      FROM documents d
      JOIN users u ON u.id = d.author_id
      JOIN (
        SELECT document_id, MAX(decided_at) AS last_decided
        FROM document_approvals WHERE decided_at IS NOT NULL GROUP BY document_id
      ) a ON a.document_id = d.id
      WHERE d.status = 'approved'
        AND ($1::int IS NULL OR u.organization_id = $1)
    `, [oid]),
    db.query(`
      SELECT COUNT(*) FROM documents d
      JOIN users u ON u.id = d.author_id
      WHERE d.status = 'on_review' AND d.updated_at < now() - INTERVAL '3 days'
        AND ($1::int IS NULL OR u.organization_id = $1)
    `, [oid]),
    db.query(`
      SELECT u.full_name, COUNT(*) AS docs
      FROM documents d JOIN users u ON u.id = d.author_id
      WHERE ($1::int IS NULL OR u.organization_id = $1)
      GROUP BY u.full_name ORDER BY docs DESC LIMIT 5
    `, [oid]),
    db.query(`
      SELECT u.full_name, COUNT(*) AS open_tasks
      FROM tasks t JOIN users u ON u.id = t.assignee_id
      WHERE t.status <> 'done'
        AND ($1::int IS NULL OR u.organization_id = $1)
      GROUP BY u.full_name ORDER BY open_tasks DESC LIMIT 10
    `, [oid]),
    db.query(`
      SELECT to_char(a.created_at::date, 'YYYY-MM-DD') AS day, COUNT(*) AS cnt
      FROM activity_log a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.created_at > now() - INTERVAL '14 days'
        AND ($1::int IS NULL OR u.organization_id = $1)
      GROUP BY day ORDER BY day
    `, [oid]),
    db.query(`
      SELECT
        (SELECT COUNT(*) FROM users
          WHERE ($1::int IS NULL OR organization_id = $1)) AS users,
        (SELECT COUNT(*) FROM organizations
          WHERE ($1::int IS NULL OR id = $1)) AS organizations,
        (SELECT COUNT(*) FROM projects
          WHERE ($1::int IS NULL OR organization_id = $1)) AS projects,
        (SELECT COUNT(*) FROM documents d JOIN users u ON u.id = d.author_id
          WHERE ($1::int IS NULL OR u.organization_id = $1)) AS documents,
        (SELECT COUNT(*) FROM tasks t JOIN projects p ON p.id = t.project_id
          WHERE ($1::int IS NULL OR p.organization_id = $1)) AS tasks
    `, [oid]),
  ]);
  return { docsByStatus, docsByType, avgApproval, stuck, topAuthors, workload, activityByDay, totals };
}
