import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/dashboard.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.get));

export default router;
