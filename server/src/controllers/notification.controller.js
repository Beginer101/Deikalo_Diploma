import * as service from '../services/notification.service.js';

export async function list(req, res) {
  res.json(await service.list(req.user.id, !!req.query.unread));
}

export async function count(req, res) {
  res.json({ unread: await service.countUnread(req.user.id) });
}

export async function markRead(req, res) {
  await service.markRead(req.params.id, req.user.id);
  res.json({ ok: true });
}

export async function markAllRead(req, res) {
  await service.markAllRead(req.user.id);
  res.json({ ok: true });
}
