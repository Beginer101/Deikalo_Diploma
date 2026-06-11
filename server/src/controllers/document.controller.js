import * as service from '../services/document.service.js';

export async function list(req, res) {
  res.json(await service.list(req.query, req.user));
}

export async function getById(req, res) {
  res.json(await service.getDetails(req.params.id));
}

export async function create(req, res) {
  res.status(201).json(await service.create(req.body, req.user));
}

export async function update(req, res) {
  res.json(await service.update(req.params.id, req.body));
}

export async function submit(req, res) {
  res.json(await service.submit(req.params.id, req.body.approver_ids, req.user));
}

export async function decide(req, res) {
  res.json(await service.decide(req.params.id, req.body.decision, req.body.comment, req.user));
}

export async function delegate(req, res) {
  res.json(await service.delegate(req.params.id, req.body.to_user_id, req.body.comment, req.user));
}

export async function addComment(req, res) {
  res.status(201).json(await service.addComment(req.params.id, req.user, req.body.body));
}

export async function remove(req, res) {
  await service.remove(req.params.id, req.user);
  res.status(204).end();
}
