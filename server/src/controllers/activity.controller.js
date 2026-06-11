import * as service from '../services/activity.service.js';

export async function list(req, res) {
  const { entity_type, limit } = req.query;
  res.json(await service.list({ entity_type, limit }, req.user));
}
