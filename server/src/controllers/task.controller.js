import * as service from '../services/task.service.js';

export async function list(req, res) {
  const { project_id, assignee_id, status } = req.query;
  res.json(await service.list({ project_id, assignee_id, status }));
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
