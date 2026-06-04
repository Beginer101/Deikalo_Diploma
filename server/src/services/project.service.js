import { httpError } from '../lib/httpError.js';
import * as projectRepo from '../repositories/project.repository.js';

// Ролі-мітки в проєкті, що дають право керування
const MANAGER_LABELS = ['координатор', 'організатор'];

// Чи може користувач створювати нові проєкти:
// admin/head завжди; учасник — якщо він координатор/організатор хоча б десь.
export async function canCreateProjects(user) {
  if (user.role === 'admin' || user.role === 'head') return true;
  return projectRepo.isCoordinatorAnywhere(undefined, user.id);
}

// Перевірка права керувати конкретним проєктом
async function assertCanManage(projectId, user) {
  if (user.role === 'admin' || user.role === 'head') return;
  const label = await projectRepo.getMemberRole(undefined, projectId, user.id);
  if (label && MANAGER_LABELS.includes(label)) return;
  throw httpError(403, 'Лише адміністратор, керівник або координатор проєкту може це робити');
}

export function list(filters) {
  return projectRepo.list(undefined, filters);
}

export async function getById(id) {
  const project = await projectRepo.findById(undefined, id);
  if (!project) throw httpError(404, 'Проєкт не знайдено');
  const members = await projectRepo.listMembers(undefined, id);
  return { ...project, members };
}

export async function create(data, user) {
  if (!(await canCreateProjects(user))) {
    throw httpError(403, 'Недостатньо прав для створення проєкту');
  }
  if (!data.title || !data.organization_id) {
    throw httpError(400, 'Вкажіть назву та організацію');
  }
  return projectRepo.create(undefined, { ...data, owner_id: user.id });
}

export async function update(id, data, user) {
  await assertCanManage(id, user);
  const project = await projectRepo.update(undefined, id, data);
  if (!project) throw httpError(404, 'Проєкт не знайдено');
  return project;
}

export async function addMember(projectId, userId, roleLabel, user) {
  await assertCanManage(projectId, user);
  return projectRepo.addMember(undefined, projectId, userId, roleLabel);
}

export async function removeMember(projectId, userId, user) {
  await assertCanManage(projectId, user);
  return projectRepo.removeMember(undefined, projectId, userId);
}

// Видалення проєкту — лише admin/head
export async function remove(id, user) {
  if (user.role !== 'admin' && user.role !== 'head') {
    throw httpError(403, 'Видалити проєкт може лише адміністратор або керівник');
  }
  return projectRepo.remove(undefined, id);
}
