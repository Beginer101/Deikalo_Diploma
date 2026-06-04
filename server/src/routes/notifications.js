import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/notification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.list));
router.get('/count', asyncHandler(ctrl.count));
router.patch('/:id/read', asyncHandler(ctrl.markRead));
router.patch('/read-all', asyncHandler(ctrl.markAllRead));

export default router;
