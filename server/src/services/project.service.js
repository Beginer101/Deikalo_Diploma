import { httpError } from '../lib/httpError.js';
import * as projectRepo from '../repositories/project.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import { notifyUser, logActivity } from './notification.service.js';

// Ролі-мітки в проєкті, що дають право керування.
// Ментор має ті ж права, що й головний організатор.
// Секретарі (департаменту/організації) прав керування НЕ мають — їхня
// функція: перевірка документів через маршрут узгодження.
const MANAGER_LABELS = ['головний організатор', 'ментор', 'організатор'];

export async function canCreateProjects(user) {
  if (user.role === 'admin' || user.role === 'head') return true;
  return projectRepo.isCoordinatorAnywhere(undefined, user.id);
}

// Перевірка права керувати конкретним проєктом (з урахуванням організації)
async function assertCanManage(projectId, user) {
  const project = await projectRepo.findById(undefined, projectId);
  if (!project) throw httpError(404, 'Проєкт не знайдено');
  if (user.role === 'admin') return project;
  // Користувач іншої організації не має доступу
  if (project.organization_id !== user.organization_id) {
    throw httpError(403, 'Проєкт належить іншій організації');
  }
  if (user.role === 'head') return project;
  const label = await projectRepo.getMemberRole(undefined, projectId, user.id);
  if (label && MANAGER_LABELS.includes(label)) return project;
  throw httpError(403, 'Лише адміністратор, керівник, головний організатор або ментор проєкту може це робити');
}

// Список проєктів: адміністратор бачить усі, решта — лише своєї організації
export function list(filters, actor) {
  const f = { ...filters };
  if (actor.role !== 'admin') f.organization_id = actor.organization_id;
  return projectRepo.list(undefined, f);
}

export async function getById(id, actor) {
  const project = await projectRepo.findById(undefined, id);
  if (!project) throw httpError(404, 'Проєкт не знайдено');
  // Перегляд відкритий усім автентифікованим користувачам (сторінки
  // організацій доступні всім); керування — лише своїй організації
  // (перевіряється в assertCanManage для операцій зміни)
  const members = await projectRepo.listMembers(undefined, id);
  return { ...project, members };
}

export async function create(data, user) {
  if (!(await canCreateProjects(user))) {
    throw httpError(403, 'Недостатньо прав для створення проєкту');
  }
  // Не-адміністратор може створювати проєкти лише у власній організації
  const organization_id = user.role === 'admin' ? data.organization_id : user.organization_id;
  if (!data.title || !organization_id) {
    throw httpError(400, 'Вкажіть назву та організацію');
  }
  const project = await projectRepo.create(undefined, { ...data, organization_id, owner_id: user.id });

  await logActivity(undefined, {
    userId: user.id,
    entityType: 'project',
    entityId: project.id,
    action: 'create',
    summary: `${user.full_name} створив(ла) проєкт «${project.title}»`,
    organizationId: project.organization_id,
    link: `/projects/${project.id}`,
  });
  return project;
}

export async function update(id, data, user) {
  await assertCanManage(id, user);
  const project = await projectRepo.update(undefined, id, data);
  if (!project) throw httpError(404, 'Проєкт не знайдено');

  await logActivity(undefined, {
    userId: user.id,
    entityType: 'project',
    entityId: project.id,
    action: 'update',
    summary: `${user.full_name} оновив(ла) проєкт «${project.title}» (статус: ${project.status})`,
    organizationId: project.organization_id,
    link: `/projects/${project.id}`,
  });
  return project;
}

export async function addMember(projectId, userId, roleLabel, user) {
  const project = await assertCanManage(projectId, user);

  // Учасником проєкту може стати лише член організації, якій належить проєкт
  const target = await userRepo.findById(undefined, userId);
  if (!target) throw httpError(404, 'Користувача не знайдено');
  if (target.organization_id !== project.organization_id) {
    throw httpError(400,
      'Користувач не є членом організації, якій належить проєкт. ' +
      'Спочатку додайте його до організації (через адміністратора або запрошення)');
  }

  const membership = await projectRepo.addMember(undefined, projectId, userId, roleLabel);

  if (target.id !== user.id) {
    await notifyUser(undefined, {
      userId: target.id,
      type: 'project_member',
      message: `Вас додано до проєкту «${project.title}» (роль: ${roleLabel || 'учасник'})`,
      link: `/projects/${projectId}`,
    });
  }
  await logActivity(undefined, {
    userId: user.id,
    entityType: 'project',
    entityId: Number(projectId),
    action: 'member_add',
    summary: `${user.full_name} додав(ла) ${target.full_name} до проєкту «${project.title}» (роль: ${roleLabel || 'учасник'})`,
    organizationId: project.organization_id,
    link: `/projects/${projectId}`,
  });
  return membership;
}

export async function removeMember(projectId, userId, user) {
  const project = await assertCanManage(projectId, user);
  const target = await userRepo.findById(undefined, userId);

  await projectRepo.removeMember(undefined, projectId, userId);

  if (target && target.id !== user.id) {
    await notifyUser(undefined, {
      userId: target.id,
      type: 'project_member',
      message: `Вас виключено з проєкту «${project.title}»`,
      link: '/projects',
    });
  }
  await logActivity(undefined, {
    userId: user.id,
    entityType: 'project',
    entityId: Number(projectId),
    action: 'member_remove',
    summary: `${user.full_name} виключив(ла) ${target ? target.full_name : 'користувача'} з проєкту «${project.title}»`,
    organizationId: project.organization_id,
    link: `/projects/${projectId}`,
  });
}

export async function remove(id, user) {
  // Видалення — лише admin/head, але head лише у власній організації
  const project = await projectRepo.findById(undefined, id);
  if (!project) throw httpError(404, 'Проєкт не знайдено');
  const allowed = user.role === 'admin' ||
    (user.role === 'head' && project.organization_id === user.organization_id);
  if (!allowed) {
    throw httpError(403, 'Видалити проєкт може лише адміністратор або керівник цієї організації');
  }

  await projectRepo.remove(undefined, id);

  await logActivity(undefined, {
    userId: user.id,
    entityType: 'project',
    entityId: Number(id),
    action: 'delete',
    summary: `${user.full_name} видалив(ла) проєкт «${project.title}»`,
    organizationId: project.organization_id,
    link: '/projects',
  });
}
