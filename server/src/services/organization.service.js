import { httpError } from '../lib/httpError.js';
import * as orgRepo from '../repositories/organization.repository.js';

export function list() {
  return orgRepo.listWithCounts();
}

export async function getById(id) {
  const org = await orgRepo.findById(undefined, id);
  if (!org) throw httpError(404, 'Організацію не знайдено');
  return org;
}

export async function create({ name, description }) {
  if (!name) throw httpError(400, 'Вкажіть назву організації');
  return orgRepo.create(undefined, { name, description });
}

export async function update(id, data) {
  const org = await orgRepo.update(undefined, id, data);
  if (!org) throw httpError(404, 'Організацію не знайдено');
  return org;
}

export function remove(id) {
  return orgRepo.remove(undefined, id);
}
