import * as service from '../services/template.service.js';

export async function list(req, res) {
  res.json(await service.list());
}

export async function create(req, res) {
  res.status(201).json(await service.create(req.body, req.user.id));
}

export async function update(req, res) {
  res.json(await service.update(req.params.id, req.body));
}

export async function remove(req, res) {
  await service.remove(req.params.id);
  res.status(204).end();
}
