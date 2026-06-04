import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/activity.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.list));

export default router;
