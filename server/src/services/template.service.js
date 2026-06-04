import { httpError } from '../lib/httpError.js';
import * as templateRepo from '../repositories/template.repository.js';

export function list() {
  return templateRepo.list();
}

export function create(data, createdBy) {
  if (!data.name) throw httpError(400, 'Вкажіть назву шаблону');
  return templateRepo.create(undefined, { ...data, created_by: createdBy });
}

export async function update(id, data) {
  const tpl = await templateRepo.update(undefined, id, data);
  if (!tpl) throw httpError(404, 'Шаблон не знайдено');
  return tpl;
}

export function remove(id) {
  return templateRepo.remove(undefined, id);
}
