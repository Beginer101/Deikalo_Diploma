import * as service from '../services/organization.service.js';

export async function list(req, res) {
  res.json(await service.list());
}

export async function getById(req, res) {
  res.json(await service.getById(req.params.id));
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
