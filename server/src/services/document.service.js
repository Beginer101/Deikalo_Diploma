import { pool } from '../db/pool.js';
import { httpError } from '../lib/httpError.js';
import { computeDocumentStatus } from '../lib/approval.js';
import * as docRepo from '../repositories/document.repository.js';
import { notifyUser, logActivity } from './notification.service.js';

// Хелпер для транзакцій
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export function list(filters, userId) {
  return docRepo.list(undefined, filters, userId);
}

export async function getDetails(id) {
  const doc = await docRepo.findById(undefined, id);
  if (!doc) throw httpError(404, 'Документ не знайдено');
  const [approvals, history, comments] = await Promise.all([
    docRepo.listApprovals(undefined, id),
    docRepo.listHistory(undefined, id),
    docRepo.listComments(undefined, id),
  ]);
  return { ...doc, approvals, history, comments };
}

export async function create(data, authorId) {
  if (!data.title) throw httpError(400, 'Вкажіть назву документа');
  return withTransaction(async (client) => {
    const doc = await docRepo.create(client, { ...data, author_id: authorId });
    await docRepo.addHistory(client, doc.id, authorId, 'Створено документ');
    return doc;
  });
}

export async function update(id, data) {
  const current = await docRepo.findRawById(undefined, id);
  if (!current) throw httpError(404, 'Документ не знайдено');
  if (!['draft', 'rejected'].includes(current.status)) {
    throw httpError(400, 'Редагувати можна лише чернетку або відхилений документ');
  }
  return docRepo.update(undefined, id, data);
}

export async function submit(id, approverIds, actor) {
  if (!Array.isArray(approverIds) || approverIds.length === 0) {
    throw httpError(400, 'Вкажіть хоча б одного погоджувача (approver_ids)');
  }
  return withTransaction(async (client) => {
    const doc = await docRepo.findRawById(client, id);
    if (!doc) throw httpError(404, 'Документ не знайдено');
    if (doc.status === 'on_review') throw httpError(400, 'Документ вже на узгодженні');

    await docRepo.deleteApprovals(client, id);
    let step = 1;
    for (const approverId of approverIds) {
      await docRepo.addApproval(client, id, approverId, step++);
    }
    await docRepo.updateStatus(client, id, 'on_review');
    await docRepo.addHistory(
      client, id, actor.id,
      `Відправлено на узгодження (${approverIds.length} погоджувач(ів))`
    );

    for (const approverId of approverIds) {
      await notifyUser(client, {
        userId: approverId,
        type: 'approval_request',
        message: `Документ «${doc.title}» очікує вашого погодження`,
        link: `/documents/${id}`,
      });
    }
    await logActivity(client, {
      userId: actor.id,
      entityType: 'document',
      entityId: Number(id),
      action: 'submit',
      summary: `${actor.full_name} відправив(ла) документ «${doc.title}» на узгодження`,
    });
    return { message: 'Документ відправлено на узгодження' };
  });
}

export async function decide(id, decision, comment, actor) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw httpError(400, 'Рішення має бути approved або rejected');
  }
  return withTransaction(async (client) => {
    const step = await docRepo.findPendingStep(client, id, actor.id);
    if (!step) throw httpError(403, 'Для вас немає активного кроку узгодження цього документа');

    await docRepo.updateApprovalDecision(client, step.id, decision, comment);

    const all = await docRepo.listApprovalDecisions(client, id);
    const docStatus = computeDocumentStatus(all);
    await docRepo.updateStatus(client, id, docStatus);

    const doc = await docRepo.findRawById(client, id);

    await docRepo.addHistory(
      client, id, actor.id,
      decision === 'rejected' ? `Відхилено${comment ? ': ' + comment : ''}` : 'Погоджено крок'
    );

    if (docStatus === 'approved') {
      await docRepo.addHistory(client, id, actor.id, 'Документ повністю затверджено');
      await notifyUser(client, {
        userId: doc.author_id,
        type: 'approved',
        message: `Ваш документ «${doc.title}» повністю затверджено`,
        link: `/documents/${id}`,
      });
    } else if (docStatus === 'rejected') {
      await notifyUser(client, {
        userId: doc.author_id,
        type: 'rejected',
        message: `Ваш документ «${doc.title}» відхилено${comment ? ': ' + comment : ''}`,
        link: `/documents/${id}`,
      });
    }

    await logActivity(client, {
      userId: actor.id,
      entityType: 'document',
      entityId: Number(id),
      action: decision === 'approved' ? 'approve' : 'reject',
      summary: `${actor.full_name} ${decision === 'approved' ? 'погодив(ла)' : 'відхилив(ла)'} крок документа «${doc.title}»`,
    });

    return { message: 'Рішення збережено', status: docStatus };
  });
}

export async function delegate(id, toUserId, comment, actor) {
  if (!toUserId) throw httpError(400, 'Вкажіть to_user_id');
  if (Number(toUserId) === actor.id) throw httpError(400, 'Не можна делегувати самому собі');

  return withTransaction(async (client) => {
    const step = await docRepo.findPendingStep(client, id, actor.id);
    if (!step) throw httpError(403, 'У вас немає активного кроку для делегування');

    await docRepo.delegateStep(client, step.id, toUserId, actor.id, comment);
    const doc = await docRepo.findRawById(client, id);

    await docRepo.addHistory(client, id, actor.id, 'Делеговано крок узгодження іншому користувачу');
    await notifyUser(client, {
      userId: Number(toUserId),
      type: 'approval_request',
      message: `Вам делеговано погодження документа «${doc.title}»`,
      link: `/documents/${id}`,
    });
    await logActivity(client, {
      userId: actor.id,
      entityType: 'document',
      entityId: Number(id),
      action: 'delegate',
      summary: `${actor.full_name} делегував(ла) погодження документа «${doc.title}»`,
    });
    return { message: 'Крок делеговано' };
  });
}

export function addComment(id, authorId, body) {
  if (!body) throw httpError(400, 'Порожній коментар');
  return docRepo.addComment(undefined, id, authorId, body);
}

export async function remove(id, actor) {
  const doc = await docRepo.findRawById(undefined, id);
  if (!doc) throw httpError(404, 'Документ не знайдено');
  if (doc.author_id !== actor.id && actor.role !== 'admin') {
    throw httpError(403, 'Видалити може лише автор або адміністратор');
  }
  await docRepo.remove(undefined, id);
}
