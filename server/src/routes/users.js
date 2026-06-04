import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/user.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.list));
router.patch('/:id/role', authorize('admin'), asyncHandler(ctrl.changeRole));

export default router;
