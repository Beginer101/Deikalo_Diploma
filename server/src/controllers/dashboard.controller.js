import * as service from '../services/dashboard.service.js';

export async function get(req, res) {
  res.json(await service.getSummary(req.user.id));
}
