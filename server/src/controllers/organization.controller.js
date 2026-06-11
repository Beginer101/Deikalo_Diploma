import * as service from '../services/organization.service.js';

export async function list(req, res) {
  res.json(await service.list(req.user));
}

export async function getById(req, res) {
  res.json(await service.getDetails(req.params.id));
}

export async function create(req, res) {
  res.status(201).json(await service.create(req.body));
}

export async function update(req, res) {
  res.json(await service.update(req.params.id, req.body));
}

export async function remove(req, res) {
  await service.remove(req.params.id);
  res.status(204).end();
}

// ---- Членство ----

export async function addMember(req, res) {
  res.status(201).json(await service.addMember(req.params.id, req.body.user_id, req.user));
}

export async function removeMember(req, res) {
  await service.removeMember(req.params.id, req.params.userId, req.user);
  res.status(204).end();
}

// ---- Запрошення ----

export async function createInvite(req, res) {
  res.status(201).json(await service.createInvite(req.params.id, req.body || {}, req.user));
}

export async function listInvites(req, res) {
  res.json(await service.listInvites(req.params.id, req.user));
}

export async function join(req, res) {
  res.json(await service.join(req.params.token, req.user));
}
