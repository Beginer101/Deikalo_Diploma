import { httpError } from '../lib/httpError.js';
import * as taskRepo from '../repositories/task.repository.js';

export function list(filters) {
  return taskRepo.list(undefined, filters);
}

export async function create(data) {
  if (!data.title || !data.project_id) {
    throw httpError(400, 'Вкажіть назву та проєкт');
  }
  return taskRepo.create(undefined, data);
}

export async function update(id, data) {
  const task = await taskRepo.update(undefined, id, data);
  if (!task) throw httpError(404, 'Задачу не знайдено');
  return task;
}

export function remove(id) {
  return taskRepo.remove(undefined, id);
}
