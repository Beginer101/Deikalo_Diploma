import * as service from '../services/user.service.js';

export async function list(req, res) {
  res.json(await service.list({ organization_id: req.query.organization_id }));
}

export async function changeRole(req, res) {
  res.json(await service.changeRole(req.params.id, req.body.role));
}
