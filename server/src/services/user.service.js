import { httpError } from '../lib/httpError.js';
import * as userRepo from '../repositories/user.repository.js';
import { notifyUser } from './notification.service.js';

export function list(filters, actor) {
  const f = { ...filters };
  // Не-адміністратор бачить лише користувачів своєї організації
  if (actor && actor.role !== 'admin') f.organization_id = actor.organization_id;
  return userRepo.list(undefined, f);
}

export async function changeRole(id, role) {
  if (!['admin', 'head', 'member'].includes(role)) {
    throw httpError(400, 'Невідома роль');
  }
  const user = await userRepo.updateRole(undefined, id, role);
  if (!user) throw httpError(404, 'Користувача не знайдено');
  return user;
}

// Безпосереднє видалення користувача (лише адміністратор)
export async function deleteUser(id, actor) {
  const target = await userRepo.findById(undefined, Number(id));
  if (!target) throw httpError(404, 'Користувача не знайдено');
  if (Number(id) === actor.id) {
    throw httpError(400, 'Не можна видалити власний обліковий запис');
  }
  if (target.role === 'admin' && (await userRepo.countAdmins()) <= 1) {
    throw httpError(400, 'Не можна видалити останнього адміністратора');
  }
  await userRepo.remove(undefined, Number(id));
}

// Керівник (або адмін) надсилає запит на видалення користувача
export async function requestDeletion(targetId, actor, reason) {
  const target = await userRepo.findById(undefined, Number(targetId));
  if (!target) throw httpError(404, 'Користувача не знайдено');
  if (Number(targetId) === actor.id) {
    throw httpError(400, 'Не можна подати запит на видалення самого себе');
  }
  // Керівник може подавати запит лише щодо користувачів своєї організації
  if (actor.role !== 'admin' && target.organization_id !== actor.organization_id) {
    throw httpError(403, 'Користувач належить іншій організації');
  }
  if (await userRepo.hasPendingRequest(undefined, Number(targetId))) {
    throw httpError(409, 'Для цього користувача вже є активний запит на видалення');
  }
  const request = await userRepo.createDeletionRequest(undefined, {
    targetUserId: Number(targetId),
    requestedBy: actor.id,
    reason,
  });
  const adminIds = await userRepo.listAdminIds();
  for (const adminId of adminIds) {
    if (adminId === actor.id) continue;
    await notifyUser(undefined, {
      userId: adminId,
      type: 'info',
      message: `${actor.full_name} подав(ла) запит на видалення користувача «${target.full_name}»`,
      link: '/users',
    });
  }
  return request;
}

export function listDeletionRequests() {
  return userRepo.listDeletionRequests(undefined, 'pending');
}

// Адміністратор підтверджує запит -> видаляє користувача
export async function approveDeletion(requestId, actor) {
  const req = await userRepo.findDeletionRequest(undefined, Number(requestId));
  if (!req) throw httpError(404, 'Запит не знайдено');
  if (req.status !== 'pending') throw httpError(400, 'Запит вже опрацьовано');

  const target = await userRepo.findById(undefined, req.target_user_id);
  if (target) {
    if (target.role === 'admin' && (await userRepo.countAdmins()) <= 1) {
      throw httpError(400, 'Не можна видалити останнього адміністратора');
    }
    await userRepo.remove(undefined, req.target_user_id);
  }
  await userRepo.updateDeletionRequestStatus(undefined, Number(requestId), 'approved', actor.id);

  if (req.requested_by) {
    await notifyUser(undefined, {
      userId: req.requested_by,
      type: 'approved',
      message: `Ваш запит на видалення користувача «${target?.full_name || ''}» підтверджено`,
      link: '/users',
    });
  }
  return { message: 'Користувача видалено, запит підтверджено' };
}

// Адміністратор відхиляє запит
export async function rejectDeletion(requestId, actor) {
  const req = await userRepo.findDeletionRequest(undefined, Number(requestId));
  if (!req) throw httpError(404, 'Запит не знайдено');
  if (req.status !== 'pending') throw httpError(400, 'Запит вже опрацьовано');

  await userRepo.updateDeletionRequestStatus(undefined, Number(requestId), 'rejected', actor.id);
  if (req.requested_by) {
    await notifyUser(undefined, {
      userId: req.requested_by,
      type: 'rejected',
      message: 'Ваш запит на видалення користувача відхилено адміністратором',
      link: '/users',
    });
  }
  return { message: 'Запит відхилено' };
}
