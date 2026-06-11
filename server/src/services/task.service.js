import { httpError } from '../lib/httpError.js';
import * as taskRepo from '../repositories/task.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import { notifyUser, logActivity } from './notification.service.js';

export function list(filters, actor) {
  const f = { ...filters };
  if (actor && actor.role !== 'admin') f.organization_id = actor.organization_id;
  return taskRepo.list(undefined, f);
}

// Виконавець задачі має бути членом організації, якій належить проєкт
async function assertAssigneeInOrg(assigneeId, organizationId) {
  const assignee = await userRepo.findById(undefined, assigneeId);
  if (!assignee) throw httpError(404, 'Виконавця не знайдено');
  if (assignee.organization_id !== organizationId) {
    throw httpError(400, 'Виконавець не є членом організації, якій належить проєкт');
  }
  return assignee;
}

export async function create(data, actor) {
  if (!data.title || !data.project_id) {
    throw httpError(400, 'Вкажіть назву та проєкт');
  }
  const project = await projectRepo.findById(undefined, data.project_id);
  if (!project) throw httpError(404, 'Проєкт не знайдено');
  if (data.assignee_id) {
    await assertAssigneeInOrg(Number(data.assignee_id), project.organization_id);
  }

  const task = await taskRepo.create(undefined, data);

  if (task.assignee_id && task.assignee_id !== actor.id) {
    await notifyUser(undefined, {
      userId: task.assignee_id,
      type: 'task_assigned',
      message: `Вам призначено задачу «${task.title}» (проєкт «${project.title}»)`,
      link: '/tasks',
    });
  }
  await logActivity(undefined, {
    userId: actor.id,
    entityType: 'task',
    entityId: task.id,
    action: 'create',
    summary: `${actor.full_name} створив(ла) задачу «${task.title}» у проєкті «${project.title}»`,
    organizationId: project.organization_id,
    link: '/tasks',
  });
  return task;
}

export async function update(id, data, actor) {
  const before = await taskRepo.findById(undefined, id);
  if (!before) throw httpError(404, 'Задачу не знайдено');
  if (data.assignee_id && Number(data.assignee_id) !== before.assignee_id) {
    await assertAssigneeInOrg(Number(data.assignee_id), before.organization_id);
  }

  const task = await taskRepo.update(undefined, id, data);

  // Сповіщення виконавцю: про нове призначення або про зміну його задачі
  const newAssignee = data.assignee_id && Number(data.assignee_id) !== before.assignee_id;
  const notifyTarget = task.assignee_id;
  if (notifyTarget && notifyTarget !== actor.id) {
    await notifyUser(undefined, {
      userId: notifyTarget,
      type: newAssignee ? 'task_assigned' : 'task_updated',
      message: newAssignee
        ? `Вам призначено задачу «${task.title}»`
        : `Задачу «${task.title}» оновлено (статус: ${task.status})`,
      link: '/tasks',
    });
  }
  await logActivity(undefined, {
    userId: actor.id,
    entityType: 'task',
    entityId: task.id,
    action: 'update',
    summary: `${actor.full_name} оновив(ла) задачу «${task.title}» (статус: ${task.status})`,
    organizationId: before.organization_id,
    link: '/tasks',
  });
  return task;
}

export async function remove(id, actor) {
  const task = await taskRepo.findById(undefined, id);
  if (!task) throw httpError(404, 'Задачу не знайдено');

  await taskRepo.remove(undefined, id);

  if (task.assignee_id && task.assignee_id !== actor.id) {
    await notifyUser(undefined, {
      userId: task.assignee_id,
      type: 'task_updated',
      message: `Задачу «${task.title}» видалено`,
      link: '/tasks',
    });
  }
  await logActivity(undefined, {
    userId: actor.id,
    entityType: 'task',
    entityId: Number(id),
    action: 'delete',
    summary: `${actor.full_name} видалив(ла) задачу «${task.title}»`,
    organizationId: task.organization_id,
    link: '/tasks',
  });
}
