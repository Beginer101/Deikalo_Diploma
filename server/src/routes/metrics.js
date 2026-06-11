import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/metrics.controller.js';

const router = Router();
// Адміністратор — метрики всієї системи, керівник — своєї організації
router.use(authenticate, authorize('admin', 'head'));

router.get('/', asyncHandler(ctrl.get));

export default router;
