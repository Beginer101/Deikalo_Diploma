import * as activityRepo from '../repositories/activity.repository.js';

// Адміністратор бачить активність усієї системи,
// керівник (head) — лише дії користувачів своєї організації
export function list(filters, actor) {
  const organization_id = actor.role === 'admin' ? null : actor.organization_id;
  return activityRepo.list(undefined, { ...filters, organization_id });
}
