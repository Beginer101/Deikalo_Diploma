import * as service from '../services/metrics.service.js';

export async function get(req, res) {
  res.json(await service.getAdminMetrics());
}
