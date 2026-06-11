import { pool } from '../db/pool.js';

// Організація, до якої належить документ: через проєкт або (якщо проєкту
// немає) через організацію автора. Використовується для сповіщень.
export async function getOrganizationId(db = pool, id) {
  const { rows } = await db.query(
    `SELECT COALESCE(p.organization_id, u.organization_id) AS organization_id
     FROM documents d
     LEFT JOIN projects p ON p.id = d.project_id
     LEFT JOIN users u ON u.id = d.author_id
     WHERE d.id = $1`,
    [id]
  );
  return rows[0]?.organization_id || null;
}

// ---- Документи ----
export async function list(db = pool, filters, userId) {
  const { project_id, status, mine, pending_for_me, organization_id } = filters;
  const params = [];
  const where = [];
  // Обмеження за організацією автора документа
  if (organization_id) {
    params.push(organization_id);
    where.push(`u.organization_id = $${params.length}`);
  }
  if (project_id) {
    params.push(project_id);
    where.push(`d.project_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`d.status = $${params.length}`);
  }
  if (mine) {
    params.push(userId);
    where.push(`d.author_id = $${params.length}`);
  }
  if (pending_for_me) {
    params.push(userId);
    where.push(
      `d.id IN (SELECT document_id FROM document_approvals
                WHERE approver_id = $${params.length} AND decision = 'pending')`
    );
  }
  const { rows } = await db.query(
    `SELECT d.*, u.full_name AS author_name, p.title AS project_title
     FROM documents d
     LEFT JOIN users u ON u.id = d.author_id
     LEFT JOIN projects p ON p.id = d.project_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY d.updated_at DESC`,
    params
  );
  return rows;
}

export async function findById(db = pool, id) {
  const { rows } = await db.query(
    `SELECT d.*, u.full_name AS author_name, p.title AS project_title
     FROM documents d
     LEFT JOIN users u ON u.id = d.author_id
     LEFT JOIN projects p ON p.id = d.project_id
     WHERE d.id = $1`,
    [id]
  );
  return rows[0];
}

export async function findRawById(db = pool, id) {
  const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);
  return rows[0];
}

export async function create(db = pool, d) {
  const { rows } = await db.query(
    `INSERT INTO documents (title, doc_type, content, status, project_id, author_id)
     VALUES ($1,$2,$3,'draft',$4,$5) RETURNING *`,
    [d.title, d.doc_type || 'загальний', d.content || null, d.project_id || null, d.author_id]
  );
  return rows[0];
}

export async function update(db = pool, id, d) {
  const { rows } = await db.query(
    `UPDATE documents SET
       title = COALESCE($1,title),
       doc_type = COALESCE($2,doc_type),
       content = COALESCE($3,content),
       updated_at = now()
     WHERE id = $4 RETURNING *`,
    [d.title, d.doc_type, d.content, id]
  );
  return rows[0];
}

export async function updateStatus(db = pool, id, status) {
  await db.query(
    `UPDATE documents SET status = $1, updated_at = now() WHERE id = $2`,
    [status, id]
  );
}

export async function remove(db = pool, id) {
  await db.query('DELETE FROM documents WHERE id = $1', [id]);
}

// ---- Маршрут узгодження ----
export async function listApprovals(db = pool, documentId) {
  const { rows } = await db.query(
    `SELECT a.*, u.full_name AS approver_name, df.full_name AS delegated_from_name
     FROM document_approvals a
     JOIN users u ON u.id = a.approver_id
     LEFT JOIN users df ON df.id = a.delegated_from
     WHERE a.document_id = $1 ORDER BY a.step_order`,
    [documentId]
  );
  return rows;
}

export async function listApprovalDecisions(db = pool, documentId) {
  const { rows } = await db.query(
    `SELECT decision FROM document_approvals WHERE document_id = $1`,
    [documentId]
  );
  return rows;
}

export async function deleteApprovals(db = pool, documentId) {
  await db.query('DELETE FROM document_approvals WHERE document_id = $1', [documentId]);
}

export async function addApproval(db = pool, documentId, approverId, stepOrder) {
  await db.query(
    `INSERT INTO document_approvals (document_id, approver_id, step_order, decision)
     VALUES ($1,$2,$3,'pending')`,
    [documentId, approverId, stepOrder]
  );
}

export async function findPendingStep(db = pool, documentId, userId) {
  const { rows } = await db.query(
    `SELECT * FROM document_approvals
     WHERE document_id = $1 AND approver_id = $2 AND decision = 'pending'`,
    [documentId, userId]
  );
  return rows[0];
}

export async function updateApprovalDecision(db = pool, stepId, decision, comment) {
  await db.query(
    `UPDATE document_approvals
     SET decision = $1, comment = $2, decided_at = now()
     WHERE id = $3`,
    [decision, comment || null, stepId]
  );
}

export async function delegateStep(db = pool, stepId, toUserId, fromUserId, comment) {
  await db.query(
    `UPDATE document_approvals
     SET approver_id = $1, delegated_from = $2, comment = $3
     WHERE id = $4`,
    [toUserId, fromUserId, comment || null, stepId]
  );
}

// ---- Історія та коментарі ----
export async function addHistory(db = pool, documentId, userId, action) {
  await db.query(
    'INSERT INTO document_history (document_id, user_id, action) VALUES ($1,$2,$3)',
    [documentId, userId, action]
  );
}

export async function listHistory(db = pool, documentId) {
  const { rows } = await db.query(
    `SELECT h.*, u.full_name AS user_name
     FROM document_history h LEFT JOIN users u ON u.id = h.user_id
     WHERE h.document_id = $1 ORDER BY h.created_at`,
    [documentId]
  );
  return rows;
}

export async function addComment(db = pool, documentId, authorId, body) {
  const { rows } = await db.query(
    `INSERT INTO comments (document_id, author_id, body) VALUES ($1,$2,$3) RETURNING *`,
    [documentId, authorId, body]
  );
  return rows[0];
}

export async function listComments(db = pool, documentId) {
  const { rows } = await db.query(
    `SELECT c.*, u.full_name AS author_name
     FROM comments c JOIN users u ON u.id = c.author_id
     WHERE c.document_id = $1 ORDER BY c.created_at`,
    [documentId]
  );
  return rows;
}
