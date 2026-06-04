import { httpError } from '../lib/httpError.js';
import * as userRepo from '../repositories/user.repository.js';

export function list(filters) {
  return userRepo.list(undefined, filters);
}

export async function changeRole(id, role) {
  if (!['admin', 'head', 'member'].includes(role)) {
    throw httpError(400, 'Невідома роль');
  }
  const user = await userRepo.updateRole(undefined, id, role);
  if (!user) throw httpError(404, 'Користувача не знайдено');
  return user;
}
