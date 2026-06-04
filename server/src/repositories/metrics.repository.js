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

// Запити для розширених метрик (адмін)
export async function adminMetrics(db = pool) {
  const [
    docsByStatus, docsByType, avgApproval, stuck,
    topAuthors, workload, activityByDay, totals,
  ] = await Promise.all([
    db.query(`SELECT status, COUNT(*) FROM documents GROUP BY status`),
    db.query(`SELECT doc_type, COUNT(*) FROM documents GROUP BY doc_type ORDER BY COUNT(*) DESC`),
    db.query(`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (last_decided - d.created_at)) / 3600), 0) AS hours
      FROM documents d
      JOIN (
        SELECT document_id, MAX(decided_at) AS last_decided
        FROM document_approvals WHERE decided_at IS NOT NULL GROUP BY document_id
      ) a ON a.document_id = d.id
      WHERE d.status = 'approved'
    `),
    db.query(`
      SELECT COUNT(*) FROM documents
      WHERE status = 'on_review' AND updated_at < now() - INTERVAL '3 days'
    `),
    db.query(`
      SELECT u.full_name, COUNT(*) AS docs
      FROM documents d JOIN users u ON u.id = d.author_id
      GROUP BY u.full_name ORDER BY docs DESC LIMIT 5
    `),
    db.query(`
      SELECT u.full_name, COUNT(*) AS open_tasks
      FROM tasks t JOIN users u ON u.id = t.assignee_id
      WHERE t.status <> 'done'
      GROUP BY u.full_name ORDER BY open_tasks DESC LIMIT 10
    `),
    db.query(`
      SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, COUNT(*) AS cnt
      FROM activity_log
      WHERE created_at > now() - INTERVAL '14 days'
      GROUP BY day ORDER BY day
    `),
    db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM organizations) AS organizations,
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(*) FROM documents) AS documents,
        (SELECT COUNT(*) FROM tasks) AS tasks
    `),
  ]);
  return { docsByStatus, docsByType, avgApproval, stuck, topAuthors, workload, activityByDay, totals };
}
