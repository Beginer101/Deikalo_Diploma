import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/activity.controller.js';

const router = Router();
// Стрічка активності: адміністратор — уся система,
// керівник — лише своя організація; іншим ролям недоступна
router.use(authenticate, authorize('admin', 'head'));

router.get('/', asyncHandler(ctrl.list));

export default router;
