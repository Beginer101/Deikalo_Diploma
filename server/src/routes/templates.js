import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/template.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.list));
router.post('/', authorize('admin', 'head'), asyncHandler(ctrl.create));
router.put('/:id', authorize('admin', 'head'), asyncHandler(ctrl.update));
router.delete('/:id', authorize('admin', 'head'), asyncHandler(ctrl.remove));

export default router;
