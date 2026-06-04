import * as activityRepo from '../repositories/activity.repository.js';

export function list(filters) {
  return activityRepo.list(undefined, filters);
}
