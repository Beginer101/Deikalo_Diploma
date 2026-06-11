import * as service from '../services/project.service.js';

export async function list(req, res) {
  const { organization_id, status } = req.query;
  res.json(await service.list({ organization_id, status }, req.user));
}

export async function getById(req, res) {
  res.json(await service.getById(req.params.id, req.user));
}

export async function create(req, res) {
  res.status(201).json(await service.create(req.body, req.user));
}

export async function update(req, res) {
  res.json(await service.update(req.params.id, req.body, req.user));
}

export async function addMember(req, res) {
  const { user_id, role_label } = req.body;
  res.status(201).json(await service.addMember(req.params.id, user_id, role_label, req.user));
}

export async function removeMember(req, res) {
  await service.removeMember(req.params.id, req.params.userId, req.user);
  res.status(204).end();
}

export async function remove(req, res) {
  await service.remove(req.params.id, req.user);
  res.status(204).end();
}
