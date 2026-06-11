import crypto from 'crypto';
import { httpError } from '../lib/httpError.js';
import * as orgRepo from '../repositories/organization.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import * as projectRepo from '../repositories/project.repository.js';
import { notifyUser, logActivity } from './notification.service.js';

// Адміністратор бачить усі організації; решта — лише ту,
// до якої приєднані (без організації — порожній список)
export function list(actor) {
  if (actor.role === 'admin') return orgRepo.listWithCounts();
  if (!actor.organization_id) return [];
  return orgRepo.listWithCounts(undefined, actor.organization_id);
}

export async function getById(id) {
  const org = await orgRepo.findById(undefined, id);
  if (!org) throw httpError(404, 'Організацію не знайдено');
  return org;
}

// Публічна (в межах системи) сторінка організації: назва, опис,
// керівники з контактами та перелік проєктів
export async function getDetails(id) {
  const org = await getById(id);
  const [heads, projects] = await Promise.all([
    userRepo.listHeadsByOrganization(undefined, id),
    projectRepo.list(undefined, { organization_id: id }),
  ]);
  return { ...org, heads, projects };
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

// ---- Членство в організації (надає адміністратор) ----

export async function addMember(orgId, userId, actor) {
  const org = await getById(orgId);
  const user = await userRepo.findById(undefined, userId);
  if (!user) throw httpError(404, 'Користувача не знайдено');
  if (user.organization_id === Number(orgId)) {
    throw httpError(400, 'Користувач вже є членом цієї організації');
  }

  const updated = await userRepo.updateOrganization(undefined, userId, orgId, null);

  await notifyUser(undefined, {
    userId: user.id,
    type: 'membership',
    message: `Вас додано до організації «${org.name}»`,
    link: '/organizations',
  });
  await logActivity(undefined, {
    userId: actor.id,
    entityType: 'organization',
    entityId: Number(orgId),
    action: 'member_add',
    summary: `${actor.full_name} додав(ла) користувача ${user.full_name} до організації «${org.name}»`,
    organizationId: Number(orgId),
    link: '/organizations',
  });
  return updated;
}

export async function removeMember(orgId, userId, actor) {
  const org = await getById(orgId);
  const user = await userRepo.findById(undefined, userId);
  if (!user || user.organization_id !== Number(orgId)) {
    throw httpError(404, 'Користувач не є членом цієї організації');
  }

  const updated = await userRepo.updateOrganization(undefined, userId, null, null);

  await notifyUser(undefined, {
    userId: user.id,
    type: 'membership',
    message: `Вас виключено з організації «${org.name}»`,
    link: '/organizations',
  });
  await logActivity(undefined, {
    userId: actor.id,
    entityType: 'organization',
    entityId: Number(orgId),
    action: 'member_remove',
    summary: `${actor.full_name} виключив(ла) користувача ${user.full_name} з організації «${org.name}»`,
    organizationId: Number(orgId),
    link: '/organizations',
  });
  return updated;
}

// ---- Одноразові тимчасові запрошення ----

const INVITE_DEFAULT_HOURS = 72;
const INVITE_MAX_HOURS = 24 * 30; // не довше за 30 діб

export async function createInvite(orgId, { role, expires_in_hours }, actor) {
  const org = await getById(orgId);

  // Хед може запрошувати лише у власну організацію і лише з роллю member;
  // адміністратор — у будь-яку організацію з роллю member або head
  if (actor.role === 'head') {
    if (actor.organization_id !== Number(orgId)) {
      throw httpError(403, 'Керівник може створювати запрошення лише для своєї організації');
    }
    role = 'member';
  } else {
    role = ['member', 'head'].includes(role) ? role : 'member';
  }

  const hours = Math.min(Number(expires_in_hours) || INVITE_DEFAULT_HOURS, INVITE_MAX_HOURS);
  const invite = await orgRepo.createInvite(undefined, {
    token: crypto.randomBytes(24).toString('hex'),
    organization_id: Number(orgId),
    role,
    created_by: actor.id,
    expires_at: new Date(Date.now() + hours * 3600 * 1000),
  });

  await logActivity(undefined, {
    userId: actor.id,
    entityType: 'organization',
    entityId: Number(orgId),
    action: 'invite_create',
    summary: `${actor.full_name} створив(ла) запрошення до організації «${org.name}» (роль: ${role}, діє ${hours} год)`,
    organizationId: Number(orgId),
    link: '/organizations',
  });

  // Клієнт складає повний URL: `${window.location.origin}/join/${token}`
  return invite;
}

export async function listInvites(orgId, actor) {
  await getById(orgId);
  if (actor.role === 'head' && actor.organization_id !== Number(orgId)) {
    throw httpError(403, 'Доступ лише до запрошень своєї організації');
  }
  return orgRepo.listInvites(undefined, orgId);
}

// Приєднання за одноразовим посиланням
export async function join(token, actor) {
  const invite = await orgRepo.findInviteByToken(undefined, token);
  if (!invite) throw httpError(404, 'Запрошення не знайдено');
  if (invite.used_at) throw httpError(400, 'Запрошення вже використано');
  if (new Date(invite.expires_at) < new Date()) {
    throw httpError(400, 'Термін дії запрошення минув');
  }
  if (actor.organization_id === invite.organization_id) {
    throw httpError(400, 'Ви вже є членом цієї організації');
  }

  // Одноразовість: атомарне погашення, повторне використання неможливе
  const claimed = await orgRepo.claimInvite(undefined, invite.id, actor.id);
  if (!claimed) throw httpError(400, 'Запрошення вже використано');

  // Роль із запрошення не повинна понижувати адміністратора системи
  const roleToApply = actor.role === 'admin' ? null : invite.role;
  const user = await userRepo.updateOrganization(
    undefined, actor.id, invite.organization_id, roleToApply
  );

  await notifyUser(undefined, {
    userId: actor.id,
    type: 'membership',
    message: `Ви приєдналися до організації «${invite.organization_name}» (роль: ${invite.role})`,
    link: '/organizations',
  });
  await logActivity(undefined, {
    userId: actor.id,
    entityType: 'organization',
    entityId: invite.organization_id,
    action: 'join',
    summary: `${actor.full_name} приєднався(лась) до організації «${invite.organization_name}» за запрошенням`,
    organizationId: invite.organization_id,
    link: '/organizations',
  });

  return { user, organization_name: invite.organization_name };
}
