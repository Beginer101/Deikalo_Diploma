// Контролер користувачів: ролі, видалення та запити на видалення.
import * as service from '../services/user.service.js';

export async function list(req, res) {
  res.json(await service.list({ organization_id: req.query.organization_id }, req.user));
}

export async function changeRole(req, res) {
  res.json(await service.changeRole(req.params.id, req.body.role));
}

export async function remove(req, res) {
  await service.deleteUser(req.params.id, req.user);
  res.status(204).end();
}

export async function requestDeletion(req, res) {
  res.status(201).json(await service.requestDeletion(req.params.id, req.user, req.body.reason));
}

export async function listDeletionRequests(req, res) {
  res.json(await service.listDeletionRequests());
}

export async function approveDeletion(req, res) {
  res.json(await service.approveDeletion(req.params.id, req.user));
}

export async function rejectDeletion(req, res) {
  res.json(await service.rejectDeletion(req.params.id, req.user));
}
